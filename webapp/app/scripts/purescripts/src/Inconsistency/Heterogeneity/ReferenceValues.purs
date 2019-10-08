module Heterogeneity.ReferenceValues where

import Prelude
import Control.Monad.Eff 
import Control.Monad.Eff.Console (CONSOLE, log, logShow)
import Data.Array
import Data.Foreign 
import Data.Foreign.Class (class Decode, encode, decode)
import Data.Foreign.Index ((!))
import Data.Foreign.Generic (defaultOptions, genericDecode, genericDecodeJSON)
import Data.Generic.Rep as Rep 
import Data.Generic.Rep.Show (genericShow)
import Control.Monad.Except (runExcept)
import Data.List.Types
import Data.Maybe
import Data.Either (Either(..))
import Data.Int
import Data.Newtype
import Data.String as S
import Data.Symbol
import Data.Lens
import Data.Lens.Record (prop)
import Data.Lens.Zoom (Traversal, Traversal', Lens, Lens', zoom)
import Partial.Unsafe (unsafePartial)

opts = defaultOptions { unwrapSingleConstructors = true }

newtype ReferenceValueQuery = ReferenceValuesQuery
  { measurement :: Array String
  , "OutcomeType" :: Array String
  ," InterventionComparisonType" :: Array String
  }

makeQueries :: Foreign -> Foreign
makeQueries fpars = fpars
