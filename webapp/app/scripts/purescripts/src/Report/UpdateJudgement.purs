module UpdateJudgement where

import Prelude
import Control.Monad.Eff 
import Data.Foreign 

import Model

foreign import data UpdateMe :: Type

foreign import data UPDATE_JUDGEMENT :: Effect

   
foreign import updateJudgement :: forall eff rj. rj -> (Eff ( updateMe :: UPDATE_JUDGEMENT | eff) Unit)
