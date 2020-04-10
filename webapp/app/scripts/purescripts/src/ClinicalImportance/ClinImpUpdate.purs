module ClinImp.Update where

import Prelude
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, log, logShow)
import Control.Monad.Except (runExcept)
import Data.Foreign
import Data.Maybe (Maybe(..))
import Data.Either (Either(..))
import Data.Tuple
import Data.Traversable
import Data.Lens
import Data.Lens.Record (prop)
import Data.Lens.Zoom (Traversal, Traversal', Lens, Lens', zoom)

import Model
import Text.Model
import SaveModel as S
import EffectMeasure
import ClinImp.Model
import ClinImp.View
import UpdateClinImpChildren

saveState :: forall eff. String -> SanitizedClinImp -> 
  Eff ( modelOut    :: S.SAVE_STATE 
      , updateClinImpChildren :: UPDATE_CHILDREN | eff) Unit
saveState s c = do
  S.saveState s c
  updateChildren

updateState :: forall eff. Foreign -> Eff (console :: CONSOLE 
                   , modelOut :: S.SAVE_STATE 
                   , updateClinImpChildren :: UPDATE_CHILDREN | eff) Unit
updateState mdl = do
  {--logShow "updating CLINIMP"--}
  let (s :: Either String State) = readState mdl
  case s of
    Left err -> do saveState "clinImp" $ sanitizeClinImp emptyClinImp
                   {--logShow $ "reading state in Report error: " <> err--}
    Right st -> do
      if hasConMat st then do
        if isReady st then do
          log $ "Clincal Importance Ready"
          else do
            saveState "clinImp" $ sanitizeClinImp (skeletonClinImp $ getEffectMeasureType st)
        else do
          saveState "clinImp" $ sanitizeClinImp emptyClinImp


set :: forall eff. Foreign -> Foreign -> Eff (console :: CONSOLE 
                   , modelOut :: S.SAVE_STATE 
                   , updateClinImpChildren :: UPDATE_CHILDREN | eff) Unit
set fci fbv = do
  let eci = runExcept $ readClinImp fci
      ebv = runExcept $ readNumber fbv
  case eci of
       {--Left err -> do logShow $ "Clin imp setting error: " <> show err--}
       Left err -> do pure unit
       Right ci -> do
         case ebv of 
           {--Left er -> logShow $ "Clin imp setting error on value" <> show er--}
           Left er -> do pure unit
           Right bv -> do
             let nci = setBaseValue bv ci
             {--logShow $ "CLIN IMP TO CHANGE" <> show ci--}
             {--logShow $ "new CLIN  IMP" <> show nci--}
             {--logShow $ "Setting base value to " <> show bv--}
             saveState "clinImp" $ sanitizeClinImp nci


setBaseValue :: Number -> ClinImp -> ClinImp
setBaseValue measure ci = 
  let bl = getDefaultMeasure $ (ci ^. _ClinImp)."emtype"
      ir = isRatio $ (ci ^. _ClinImp)."emtype"
      df = measure - bl
      bounds
        | measure > bl =
          if ir 
            then
              Tuple (1.0/measure) measure
            else
              Tuple (-measure) measure
        | otherwise =
          if ir 
             then
               Tuple measure  (1.0/measure)
             else
               Tuple measure  (-measure)
  in ClinImp $ (ci ^. _ClinImp) { lowerBound = fst bounds
                                , upperBound = snd bounds
                                , baseValue = measure
                                , status = "ready"
                                }

updateChildren :: forall eff. Eff ( updateClinImpChildren :: UPDATE_CHILDREN 
                                  | eff ) Unit
updateChildren = do 
  updateClinImpChildren


reSet :: forall eff. Foreign -> 
  Eff ( modelOut    :: S.SAVE_STATE 
      , console     :: CONSOLE
      , updateClinImpChildren :: UPDATE_CHILDREN | eff) Unit
reSet fmt = do
  let emt = runExcept $ readEffectMeasureType fmt
  case emt of
       {--Left err -> do  return () logShow $ "Clin imp reSetting error: " <> show err--}
       Left err -> do pure unit
       Right mt -> do
         let nci = skeletonClinImp mt
         saveState "clinImp" $ sanitizeClinImp nci
