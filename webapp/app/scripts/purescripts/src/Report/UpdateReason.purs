module UpdateReason where

import Prelude
import Control.Monad.Eff 
import Data.Foreign 

import Model

foreign import data UpdateMe :: Type

foreign import data UPDATE_REASON :: Effect
   
foreign import updateReason :: forall eff rj. rj -> (Eff ( updateMe :: UPDATE_REASON | eff) Unit)
