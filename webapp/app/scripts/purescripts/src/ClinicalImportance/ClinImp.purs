module ClinImp where

import Prelude 
import Data.Maybe (Maybe(..))
import Data.Either (Either(..))
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, log, logShow)
import Control.Monad.Except (runExcept)
import Data.Foreign
import Data.Newtype
import Data.Number
import Data.Lens 
import Data.Lens.Fold 
import Data.Lens.Fold.Partial
import Data.Lens.Grate 
import Data.Lens.Index 
import Data.Lens.Lens 
import Data.Lens.Record
import Data.Lens.Setter
import Data.Lens.Zoom
import Data.Tuple

import Model 
import EffectMeasure
import ClinImp.Model
import SaveModel

isValid :: Foreign -> Foreign -> Foreign
isValid fci fbv = do
  let eci = runExcept $ readClinImp fci
      ebv = runExcept $ readNumber fbv
  case eci of
       Left _ -> toForeign $ Tuple "Could read State" false
       Right ci -> do
         let ir = isRatio $ (ci ^. _ClinImp)."emtype"
         case ebv of
            Left er -> toForeign $ Tuple "Couldn't read Value" false
            Right bv
              | isNaN bv -> toForeign $ Tuple "not a number" false
              | ir && bv < 0.0 -> toForeign $ Tuple "< 0 for ratio measure" false
              | otherwise -> toForeign $ Tuple "Success" true

showValid :: forall eff. Foreign -> Foreign -> Eff (console :: CONSOLE 
                   , modelOut :: SAVE_STATE | eff) Unit
showValid fci fbv = do
  let eci = runExcept $ readClinImp fci
      ebv = runExcept $ readNumber fbv
  case eci of
       Left er -> logShow $ "error reading clin imp" <> show er
       Right ci -> logShow $ "read clin Imp correctly" <> show ci

