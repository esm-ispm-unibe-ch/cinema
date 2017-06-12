module Nodes where

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
import Data.Either (Either(..))
import Data.Int
import Data.String as S
import Data.Symbol
import Data.Lens
import Data.Lens.Index
import Data.Lens.Record (prop)
import Data.Lens.Zoom (Traversal, Traversal', Lens, Lens', zoom)
import Partial.Unsafe (unsafePartial)

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

getNodes :: Foreign -> Array Node
getNodes mdl = do
  let (s :: Either String State) = readState mdl
  case s of
    Left err -> []
    Right st -> do
      let selects = getSelected st
          allnodes = (st  ^. _State <<< project <<< _Project 
                <<< studies <<< _Studies)."nodes"
      let nds = sort $ filter (isSelectedNode selects) allnodes
      nds
-- ContributionMatrix >

setNodeIntType :: forall eff. Foreign -> Foreign -> Foreign -> Eff (console :: CONSOLE 
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
            Just n -> over (ix n) (\node ->  Node $ 
                           (node ^. _Node) {
                             interventionType = Just it 
                             }
                           ) nds 
  logShow $ "changing node" <> (show nd) <> it
                  
