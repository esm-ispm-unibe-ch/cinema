module ReadModel where

import Prelude
import Control.Monad.Eff 
import Data.Foreign 

foreign import data ModelIn :: Type

foreign import data READ_STATE :: Effect

foreign import readModel :: forall eff. Eff ( modelIn :: READ_STATE | eff) Foreign
