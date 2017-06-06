module ClinImp.View where

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
import Data.Maybe
import Data.Either (Either(..))
import Data.Traversable
import Text.Handlebars (compile)
import Data.Lens 
import Data.Lens.Index
import Data.Lens.Record
import Data.Lens.Traversal
import Text.Smolder.Renderer.String (render) as S 
import Partial.Unsafe (unsafePartial)

import Report.Actions
import Report.Template as T
import Model
import Text.Model
import StudyLimitationsModel
import InconsistencyModel
import ClinImp.Model

opts = defaultOptions { unwrapSingleConstructors = true }

register :: forall e. Foreign -> Unit
register s = unit

isReady :: State -> Boolean
isReady = hasConMat
