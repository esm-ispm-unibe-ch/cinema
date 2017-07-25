module UpdateHeterogeneity where

import Prelude
import Control.Monad.Eff 

foreign import data UPDATE_HETER :: Effect

foreign import updateHeter :: forall eff. 
    Eff ( updateheter :: UPDATE_HETER | eff) Unit
