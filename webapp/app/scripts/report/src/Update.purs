module Main.Update where

import Prelude
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, log, logShow)
import Data.Foreign
import Data.Maybe (Maybe(..))
import Data.Either (Either(..))
import Data.Traversable

import Model
import Actions
import Main.View
import SaveModel

updateState :: forall eff. Foreign -> Eff (console :: CONSOLE 
                   , modelOut :: SAVE_STATE 
                   | eff
                   ) Unit
updateState mdl = do
  let (s :: Either String State) = readState mdl
  case s of
    Left err -> do saveState $ Report { status : "notReady" }
                   logShow $ "reading state in Report error: " <> err
    Right st -> do
      if isReady st then do
          saveState $ Report { status : "ready" }
          {--let rows = foldl (<>) "" $ map (\c -> isSelectedComparison c--}
          {--                (getSelected st) <> "\n" ) (getDirects st)  --}
          {--log $ "Report Ready selected rows" <> rows--}
        else do
          saveState $ Report { status : "notReady" }
          log "Report Not Ready"
