module SaveModel where

import Prelude
import Control.Monad.Eff 
import Data.Foreign 
import Data.Function.Uncurried (Fn2, runFn2)

import Model

foreign import data ModelOut :: Type

foreign import data SAVE_STATE :: Effect

foreign import saveStateImpl :: forall eff pos st. Fn2 pos st 
             (Eff ( modelOut :: SAVE_STATE | eff) Unit)

saveState :: forall eff pos st. pos -> st ->
          (Eff ( modelOut :: SAVE_STATE | eff) Unit)
saveState pos st = runFn2 saveStateImpl pos st

