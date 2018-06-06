module Report where

import Prelude 
import Data.Maybe (Maybe(..))
import Data.Either (Either(..))
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, log, logShow)
import Control.Monad.Except (runExcept)
import Data.Foreign (Foreign)
import Data.Newtype
import Data.Lens 
import Data.Lens.Fold 
import Data.Lens.Fold.Partial
import Data.Lens.Grate 
import Data.Lens.Index 
import Data.Lens.Lens 
import Data.Lens.Record
import Data.Lens.Setter
import Data.Lens.Zoom

import Model 
import StudyLimitationsModel
import Report.View as V

render :: Foreign -> String 
render m = do
    let rs = readState m  
    case rs of 
     Left a -> V.errorTemplate a 
     Right b -> V.template b
