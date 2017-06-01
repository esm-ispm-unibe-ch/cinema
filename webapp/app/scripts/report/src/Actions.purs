module Actions where

import Prelude
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, log, logShow)
import Data.Foreign (Foreign)
import Data.Maybe (Maybe(..))
import Data.Either (Either(..))
import Text.Handlebars (compile)
import TemplateReport as T
import Data.Lens 
import Data.Lens.Lens 
import Data.Lens.Record
import Text.Smolder.HTML (html, head, meta, link, title, body, h1, p)
import Text.Smolder.HTML.Attributes (lang, charset, httpEquiv, content, name,
                                    rel, href)
import Text.Smolder.Markup (on, (#!), Markup, text, (!))
import Text.Smolder.Renderer.String (render)

import Model
import ReadModel
import SaveModel

testAction :: forall e. Foreign -> Eff (console :: CONSOLE
                                       , modelOut :: SAVE_STATE | e) Unit
testAction a = do 
  let s = readState a 
  case (s :: Either String State) of
    Left err -> logShow $ "error" <> err
    Right st -> do
        logShow $ "Test Report Action " <> (st ^. _State <<< project <<< _Project)."title"
        {--saveState $ Report { status : "notReady" }--}
