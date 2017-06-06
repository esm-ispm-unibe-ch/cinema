module ClinImp.Update where

import Prelude
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, log, logShow)
import Data.Foreign
import Data.Maybe (Maybe(..))
import Data.Either (Either(..))
import Data.Traversable
import Data.Lens
import Data.Lens.Record (prop)
import Data.Lens.Zoom (Traversal, Traversal', Lens, Lens', zoom)

import Model
import Text.Model
import SaveModel
import ClinImp.Model
import ClinImp.View


updateState :: forall eff. Foreign -> Eff (console :: CONSOLE 
                   , modelOut :: SAVE_STATE | eff) Unit
updateState mdl = do
  let (s :: Either String State) = readState mdl
  case s of
    Left err -> do saveState "clinImp" emptyClinImp
                   logShow $ "reading state in Report error: " <> err
    Right st -> do
      if isReady st then do
          saveState "clinImp" (skeletonClinImp $ getEffectMeasureType st)
          {--let rows = foldl (<>) "" $ map (\c -> isSelectedComparison c--}
          {--                (getSelected st) <> "\n" ) (getDirects st)  --}
          {--log $ "Report Ready selected rows" <> rows--}
          log $ "Clincal Importance Ready"
        else do
          saveState "clinImp" emptyClinImp
          log $ "Clinical Importance  Not Ready"

