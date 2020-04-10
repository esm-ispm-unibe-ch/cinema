module UpdateClinImpChildren where

import Prelude
import Control.Monad.Eff 

foreign import data UPDATE_CHILDREN :: Effect

foreign import updateClinImpChildren :: forall eff. 
    Eff ( updateClinImpChildren :: UPDATE_CHILDREN | eff) Unit
