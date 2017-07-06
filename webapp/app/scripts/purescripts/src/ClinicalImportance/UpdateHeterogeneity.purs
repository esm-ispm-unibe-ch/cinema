module UpdateHeterogeneity where

import Prelude
import Control.Monad.Eff 
import Data.Foreign 

foreign import data UPDATE_HETER :: Effect

foreign import updateHeter :: forall eff. 
    Eff ( updateheter :: UPDATE_HETER | eff) Unit
