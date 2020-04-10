module DownloadJudgements where

import Prelude
import Control.Monad.Eff 

foreign import data DOWNLOAD_JUDGEMENTS :: Effect

foreign import downloadJudgements :: forall eff. 
    Eff ( downloadJudgements :: DOWNLOAD_JUDGEMENTS | eff) Unit
