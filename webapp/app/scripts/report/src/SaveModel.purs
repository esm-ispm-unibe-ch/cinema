module SaveModel where

import Prelude
import Control.Monad.Eff 
import Data.Foreign 

import Model

foreign import data ModelOut :: Type

foreign import data SAVE_STATE :: Effect

foreign import saveState :: forall eff rec. rec -> Eff ( modelOut :: SAVE_STATE | eff) Unit

