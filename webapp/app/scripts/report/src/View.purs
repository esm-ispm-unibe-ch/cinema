module Main.View where

import Prelude
import Control.Monad.Eff 
import Control.Monad.Eff.Unsafe
import Control.Monad.Eff.Console
import Data.Foreign (Foreign)
import Data.Maybe (Maybe(..))
import Data.Either (Either(..))
import Text.Handlebars (compile)
import TemplateReport as T
import Data.Lens 
import Data.Lens.Lens 
import Data.Lens.Record
import Text.Smolder.HTML 
import Text.Smolder.HTML.Attributes (lang, charset, httpEquiv, content, name,
                                    rel, href)
import Text.Smolder.Markup 
import Text.Smolder.Renderer.String (render) as S 

import Model
import Actions

register :: forall e. Foreign -> Unit
register s = unit

isReady :: State -> Boolean
isReady s 
  | (s ^. _State <<< project <<< _Project 
    <<< netRob <<< _NetRobModel 
    <<< studyLimitations <<< _StudyLimitations)
    ."status" == "ready" = true
  | (s ^. _State <<< project <<< _Project 
    <<< inconsistency <<< _Inconsistency)
    ."status" == "ready" = true
  | otherwise = false

type ViewModel r = 
  { isReady :: Boolean
  , test :: String
  | r
  }

template :: State -> String
template a = 
    let b :: ViewModel ( project :: Project )
        b = { project : a ^. _State  <<< project, isReady : isReady a , test : "lkj" }
        viewData = b
    in compile T.template viewData

errorTemplate :: forall a. a -> String
errorTemplate = compile "<div class='error-cont error col-md-offset-1 \
  \ col-md-10'> {{{.}}} </div>"
  
