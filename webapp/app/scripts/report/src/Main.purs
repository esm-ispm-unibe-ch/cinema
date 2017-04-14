module Main where

import Model 
import Prelude 
import Data.Maybe (Maybe(..))
import Data.Either (Either(..))
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, log)
import Control.Monad.Except (runExcept)
import Data.Foreign (Foreign)
{--import Data.Lens (view, traversed, _1, _2, _Just, _Left, lens, collectOf)--}
{--import Data.Lens.Fold ((^?))--}
{--import Data.Lens.Fold.Partial ((^?!), (^@?!))--}
{--import Data.Lens.Grate (Grate, cloneGrate, grate, zipWithOf)--}
{--import Data.Lens.Index (ix)--}
{--import Data.Lens.Lens (ilens, IndexedLens, cloneIndexedLens)--}
{--import Data.Lens.Record (prop)--}
{--import Data.Lens.Setter (iover)--}
{--import Data.Lens.Zoom (Traversal, Traversal', Lens, Lens', zoom)--}
{----}
{----}
main :: String -> Eff (console :: CONSOLE) Unit
main = do
  log

readState :: Foreign -> Maybe State
readState m = do
  case runExcept $ getState m of
       Left b -> Nothing
       Right a -> Just a

getStudyLimitations :: Maybe State -> String
getStudyLimitations s = do
    case s of 
         Nothing -> "Not Ready"
         Just a -> do
           let b =  a
           show b
  
sceletonReport :: Report
sceletonReport = Report { id : 24 } 

render :: Foreign -> String 
render = readState >>> getStudyLimitations
