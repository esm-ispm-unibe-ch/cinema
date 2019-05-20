module Heterogeneity.Nodes where

import Prelude
import Control.Monad.Eff 
import Control.Monad.Eff.Unsafe
import Control.Monad.Eff.Console (CONSOLE, log, logShow)
import Data.Array
import Data.Foreign 
import Data.Foreign.Class (class Decode, encode, decode)
import Data.Foreign.Index ((!))
import Data.Foreign.Generic (defaultOptions, genericDecode, genericDecodeJSON)
import Data.Generic.Rep as Rep 
import Data.Generic.Rep.Show (genericShow)
import Control.Monad.Except (runExcept)
import Data.Maybe
import Data.Either (Either(..), isLeft, fromRight)
import Data.Int
import Data.String as S
import Data.Symbol
import Data.Lens
import Data.Lens.Index
import Data.Lens.Record (prop)
import Data.Lens.Zoom (Traversal, Traversal', Lens, Lens', zoom)
import Partial.Unsafe (unsafePartial)

import ComparisonModel
import InconsistencyModel
import Model
import Text.Model
import SaveModel


opts = defaultOptions { unwrapSingleConstructors = true }

getState :: forall eff. Foreign -> Eff (console :: CONSOLE | eff) Unit
getState mdl = do
  let (s :: Either String State) = readState mdl
  case s of
     Left err -> log $ "error in state " <> err
     Right st -> do
       let selects = getSelected st
           allnodes = (st  ^. _State <<< project <<< _Project 
                <<< studies <<< _Studies)."nodes"
           nds = filter (isSelectedNode selects) allnodes
           lkj = map (stringToComparison ":") selects
       {--log $ "all nodes are " <> show allnodes--}
       log $ "THE  E E E E E E Eselected nodes are " <> show nds

nodesToForeign :: Array Node -> Foreign
nodesToForeign nds = toForeign $ map 
  (\n -> nodeId .~ (n ^. _Node)."label" 
  $ (n ^. _Node)) nds

setNodes :: Foreign -> Foreign
setNodes mdl = do
  let (s :: Either String State) = readState mdl
  case s of
    Left err -> toForeign []
    Right st -> do
      let selects = getSelected st
          studiesNodes = (st  ^. _State <<< project <<< _Project 
                       <<< studies <<< _Studies)."nodes"
          nds = sort $ filter (isSelectedNode selects) studiesNodes
      nodesToForeign nds


getNodes :: Foreign -> Array Node
getNodes mdl = do
  let (s :: Either String State) = readState mdl
  case s of
    Left err -> []
    Right st -> do
      let nds = (st  ^. _State <<< project <<< _Project
                       <<< heterogeneity <<< _Heterogeneity
                       <<< referenceValues <<< _ReferenceValues)."treatments"
      nds


chooseInterventionType :: String -> Array InterventionType
chooseInterventionType id = do
  let defaults = over (ix 0) 
          (\it -> InterventionType $ (it ^. _InterventionType) 
            { isActive = false
            , isSelected = false
            } ) 
          defaultInterventionTypes
      chosen = findIndex (\it -> (it ^. _InterventionType)."id" == id)
          defaults
      out = case chosen of 
             Nothing -> defaults
             Just ci -> over (ix ci) 
               (\it -> InterventionType $ (it ^. _InterventionType) 
                 { isActive = true
                 , isSelected = true
                 } 
               ) defaults 
  out
  
deselectIntTypes :: forall eff. Foreign -> 
                      Eff (console :: CONSOLE 
                        , modelOut :: SAVE_STATE 
                        | eff
                      ) Unit
deselectIntTypes mdl = do
  let nds = getNodes mdl
  let out = map (\node -> _Node <<< interventionType .~
                defaultInterventionTypes $ node) nds 
  {--logShow $ "changing node" <> (show out) <> it--}
  {--saveState "heterogeneity.referenceValues.status" "not-set"--}
  saveState "heterogeneity.referenceValues.treatments" $
    nodesToForeign out
                  

setAllNodesIntType :: forall eff. Foreign -> Foreign -> 
                      Eff (console :: CONSOLE 
                        , modelOut :: SAVE_STATE 
                        | eff
                      ) Unit
setAllNodesIntType mdl intype = do
  let nds = getNodes mdl
  let it = case runExcept (readString intype) of
            Left _ -> "undefined"
            Right t -> t 
  let out = map (\node -> _Node <<< interventionType .~
                (chooseInterventionType it) $ node) nds 
  {--logShow $ "changing node" <> (show out) <> it--}
  saveState "heterogeneity.referenceValues.status" "edited"
  saveState "heterogeneity.referenceValues.treatments" $
    nodesToForeign out
                  

setNodeIntType :: forall eff. Foreign -> Foreign -> Foreign -> 
                      Eff (console :: CONSOLE 
                        , modelOut :: SAVE_STATE 
                        | eff
                      ) Unit
setNodeIntType mdl nodeLabel intype = do
  let nds = getNodes mdl
  let nl = case runExcept (readString nodeLabel) of
            Left _ -> "undefined"
            Right l -> l 
  let it = case runExcept (readString intype) of
            Left _ -> "undefined"
            Right t -> t 
  let nd = findIndex (\n -> (n ^. _Node)."label" == nl) nds
  let out = case nd of
            Nothing -> nds
            Just n -> over (ix n) (\node -> 
                            _Node <<< interventionType .~
                            (chooseInterventionType it)
                            $ node
                           ) nds 
  {--logShow $ "changing node" <> (show out) <> it--}
  saveState "heterogeneity.referenceValues.status" "edited"
  saveState "heterogeneity.referenceValues.treatments" $
    nodesToForeign out
                  
hasSelectedAll :: Foreign -> Boolean
hasSelectedAll mdl = do 
  let nodes = getNodes mdl
  all (\n ->  any (\it -> (it ^. _InterventionType)."isSelected" == true) 
          (n ^. _Node <<< interventionType)) nodes

getInterventionType :: Foreign -> TreatmentId -> Maybe InterventionType
getInterventionType mdl tid = do 
  let nodes = getNodes mdl
  let mnode = findIndex (\n -> (n ^. _Node)."id" == tid) nodes 
  case mnode of
       Nothing -> Nothing
       Just nodeIx -> do
         let node = unsafePartial $ fromJust $ nodes !! nodeIx
             minttype = findIndex (\it -> (it ^. _InterventionType)."isSelected" == true)
                         $ (node  ^. _Node)."interventionType"
         case minttype of
           Nothing -> Nothing
           Just inttype -> ((node ^. _Node)."interventionType") !! inttype

isTheSameComparison :: Foreign -> Foreign -> Boolean
isTheSameComparison fc1 fc2 = do
  let ec1 = runExcept $ readString fc1
  let ec2 = runExcept $ readString fc2
  if any isLeft [ec1, ec2] then
    false
    else do
      let c1 = case ec1 of
             Left _ -> skeletonComparison
             Right sc1 -> stringToComparison ":" sc1
          c2 = case ec2 of
             Left _ -> skeletonComparison
             Right sc2 -> stringToComparison ":" sc2
      c1 == c2 && (c1 /= skeletonComparison) && (c2 /= skeletonComparison)

getComparisonType :: Foreign -> Foreign -> String
getComparisonType mdl fid = do
  let (s :: Either String State) = readState mdl
  let eid = runExcept $ readString fid
  case s of
    Left err -> ""
    Right st -> do
      case eid of
           Left err -> ""
           Right sid -> do
             let allnodes = getNodes mdl
                 comp = (stringToComparison ":" sid) ^. _Comparison
                 mtype1 = (getInterventionType mdl $ comp."t1")
                 mtype2 = (getInterventionType mdl $ comp."t2")
             case any isNothing [mtype1, mtype2] of
               true -> ""
               false -> do
                 let type1 = (unsafePartial $ fromJust mtype1 ^.
                             _InterventionType)."id"
                     type2 = (unsafePartial $ fromJust mtype2 ^.
                             _InterventionType)."id"
                 if any (\t -> t == "Non-pharmacological") [type1, type2] then
                   "Non-pharmacological vs any"
                   else
                   if any (\t -> t == "Placebo/Control") [type1, type2] then
                     "Pharmacological vs Placebo/Control"
                     else
                      "Pharmacological vs Pharmacological"

{--CIlow CIhigh PrIlow PrIhigh zonelower zonehigher nmaEffect null--}
jointCrosses :: Foreign -> Foreign 
  -> Foreign -> Foreign 
  -> Foreign -> Foreign 
  -> Foreign -> Foreign 
  -> Array Int
jointCrosses fil fih fprl fprh fzl fzh feffect fnul = do
  let eil = runExcept $ readNumber fil
  let eih = runExcept $ readNumber fih
  let eprl = runExcept $ readNumber fprl
  let eprh = runExcept $ readNumber fprh
  let ezl = runExcept $ readNumber fzl
  let ezh = runExcept $ readNumber fzh
  let eeffect = runExcept $ readNumber feffect
  let enul = runExcept $ readNumber fnul
  let fromRight = (\e -> case e of
                   Left _ -> -1.0
                   Right v -> v)
  case any isLeft [eil, eih, eprl, eprh, ezl, ezh, eeffect, enul] of
    true  -> [-1, -1]
    false -> 
      let il = fromRight eil
          ih = fromRight eih
          prl = fromRight eprl
          prh = fromRight eprh
          zl' = fromRight ezl
          zh' = fromRight ezh
          effect = fromRight eeffect
          effectInZone = il > zl' && ih < zh'
          nul = fromRight enul
          {--Toshi's rule--}
          zl = if (effect > nul || effectInZone) then
                 zl' else nul
          zh = if (effect < nul || effectInZone) then
                 zh' else nul
          icrs = numberOfCrosses il effect ih zl nul zh
          prcrs = numberOfCrosses prl effect prh zl nul zh
       in [icrs, prcrs]

numberOfCrosses :: Number -> Number -> Number -> Number -> Number -> Number -> Int
numberOfCrosses il effect ih zl nul zh =
  let t1 = zl - ih
      t2 = zh - il
      d1 = zl - il
      d2 = zh - ih
      effectInZone = il > zl && ih < zh
   in if effectInZone
        then 0
        else
          case t1 * t2 > 0.0 of
            true  -> 0
            false -> case d1 * d2 > 0.0 of
                         true -> 1
                         false -> case d2 > 0.0 of
                                       true -> 0
                                       false -> 2

ruleLevel :: Foreign -> Foreign -> Int
ruleLevel fcicrs fpricrs = do
  let ecicrs = runExcept $ readInt fcicrs
  let epricrs = runExcept $ readInt fpricrs
  let fromRight = (\e -> case e of
                   Left _ -> -1
                   Right v -> v)
  case any isLeft [ecicrs, epricrs] of
       true -> -1
       false -> 
         let cicrs  = fromRight ecicrs
             pricrs = fromRight epricrs
             ruleTable = [[1,2,3]
                         ,[0,1,2]
                         ,[0,0,1]]
          in unsafePartial $ fromJust ((unsafePartial $ fromJust 
               (ruleTable !! cicrs )) !! pricrs)
