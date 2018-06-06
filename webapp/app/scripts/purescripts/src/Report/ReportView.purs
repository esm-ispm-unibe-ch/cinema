module Report.View where

import Prelude
import Control.Monad.Eff 
import Control.Monad.Eff.Unsafe
import Control.Monad.Eff.Console (CONSOLE, log, logShow)
import Data.Array
import Data.String as S
import Data.Foreign (Foreign)
import Data.Foreign.Class (class Decode, encode, decode)
import Data.Foreign.Index ((!))
import Data.Foreign.Generic (defaultOptions, genericDecode, genericDecodeJSON)
import Data.Generic.Rep as Rep 
import Data.Generic.Rep.Show (genericShow)
import Control.Monad.Except (runExcept)
import Data.Function
import Data.Either (Either(..))
import Data.Traversable
import Text.Handlebars (compile)
import Data.Lens 
import Data.Lens.Index
import Data.Lens.Record
import Data.Lens.Traversal
import Text.Smolder.Renderer.String (render) as S 

import Report.Template as T
import Model
import Text.Model
import StudyLimitationsModel
import ComparisonModel
import InconsistencyModel
import ImprecisionModel
import IndirectnessModel
import PubbiasModel
import Report.Model
import Report.Update as RU

opts = defaultOptions { unwrapSingleConstructors = true }

register :: forall e. Foreign -> Unit
register s = unit

isReady :: State -> Boolean
isReady st = (st ^. _State <<< project <<< _Project 
  <<< report <<< _Report)."status" == "ready"

type ViewModel r = 
  { isReady :: Boolean
  , directRows :: Array ReportRow
  , indirectRows :: Array ReportRow
  , hasDirects :: Boolean
  , hasIndirects :: Boolean
  | r
  }


template :: State -> String
template a = 
    let b :: ViewModel ( project :: Project )
        b = { project : a ^. _State  <<< project
            , isReady : isReady a 
            , directRows : RU.directRows a
            , indirectRows : RU.indirectRows a
            , hasDirects : RU.hasDirects a
            , hasIndirects : RU.hasIndirects a
          }
        viewData = b
    in compile T.template viewData

errorTemplate :: forall a. a -> String
errorTemplate = compile "<div class='error-cont error col-md-offset-1 \
  \ col-md-10'> {{{.}}} </div>"
