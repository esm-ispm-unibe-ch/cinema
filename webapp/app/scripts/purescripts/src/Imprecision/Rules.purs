module Imprecision.Rules where

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
import ImprecisionModel
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

{--CIlow effect CIhigh zonelower Null zonehigher--}
numberOfCrosses :: Foreign -> Foreign -> Foreign -> Foreign -> Foreign -> Foreign -> Int
numberOfCrosses fil feffect fih fzl fnul fzh = do
  let eil = runExcept $ readNumber fil
  let eeffect = runExcept $ readNumber feffect
  let eih = runExcept $ readNumber fih
  let ezl = runExcept $ readNumber fzl
  let enul = runExcept $ readNumber fnul
  let ezh = runExcept $ readNumber fzh
  let fromRight = (\e -> case e of
                   Left _ -> -1.0
                   Right v -> v)
  case any isLeft [eil, eeffect, eih, ezl, enul, ezh] of
    true  -> -1
    false -> 
      let il = fromRight eil
          effect = fromRight eeffect
          ih = fromRight eih
          zl' = fromRight ezl
          zh' = fromRight ezh
          effectInZone = il > zl' && ih < zh'
          nul = fromRight enul
          {--Toshi's rule--}
          zl = if (effect > nul) then
                 zl' else nul
          zh = if (effect < nul) then
                 zh' else nul
          t1 = zl - ih
          t2 = zh - il
          d1 = zl - il
          d2 = zh - ih
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
             ruleTable = [[1,2,3],[0,1,2],[0,0,1]]
          in unsafePartial $ fromJust ((unsafePartial $ fromJust 
               (ruleTable !! cicrs )) !! pricrs)
