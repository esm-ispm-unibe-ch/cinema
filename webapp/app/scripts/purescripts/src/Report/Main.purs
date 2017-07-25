module Main where

import Prelude 
import Data.Maybe (Maybe(..))
import Data.Either (Either(..))
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, log, logShow)
import Control.Monad.Except (runExcept)
import Data.Foreign (Foreign)
import Data.Newtype
import Data.Lens 
import Data.Lens.Fold 
import Data.Lens.Fold.Partial
import Data.Lens.Grate 
import Data.Lens.Index 
import Data.Lens.Lens 
import Data.Lens.Record
import Data.Lens.Setter
import Data.Lens.Zoom

import Model 
import ClinImp

main :: Eff (console :: CONSOLE) Unit
main = do
  log "purescript started"
