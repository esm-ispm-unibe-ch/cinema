module ResetJudgements where

import Prelude
import Control.Monad.Eff 

foreign import data RESET_JUDGEMENTS :: Effect

foreign import resetJudgements :: forall eff. 
    Eff ( resetJudgements :: RESET_JUDGEMENTS | eff) Unit
