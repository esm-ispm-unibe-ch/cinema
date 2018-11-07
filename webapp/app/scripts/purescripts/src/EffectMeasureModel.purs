module EffectMeasure where 

import Prelude
import Control.Monad.Eff 
import Data.Array
import Data.Foreign 
import Data.Foreign.Class (class Decode, encode, decode)
import Data.Foreign.Index ((!))
import Data.Foreign.Generic (defaultOptions, genericDecode, genericDecodeJSON)
import Data.Generic.Rep as Rep 
import Data.Generic.Rep.Show (genericShow)
import Control.Monad.Except (runExcept)
import Data.Maybe
import Data.Either
import Data.Int
import Data.Newtype
import Data.Symbol
import Data.Lens
import Data.Lens.Record (prop)
import Data.Lens.Zoom (Traversal, Traversal', Lens, Lens', zoom)
import Partial.Unsafe (unsafePartial)

opts = defaultOptions { unwrapSingleConstructors = true }

-- EffectMeasureType <
data EffectMeasureType = RR | OR | RD | MD | SMD

derive instance genericEffectMeasureType :: Rep.Generic EffectMeasureType _

instance showEffectMeasureType :: Show EffectMeasureType where
  show RR  = "RR"
  show OR  = "OR"
  show RD  = "RD"
  show MD  = "MD"
  show SMD = "SMD"

instance decodeEffectMeasureType :: Decode EffectMeasureType where
  decode = readEffectMeasureType

readEffectMeasureType :: Foreign -> F EffectMeasureType
readEffectMeasureType fem = do
  let mem = runExcept $ readString fem
  case mem  of 
       Left _ -> fail $ ForeignError "not a string"
       Right em -> case em of 
                        "RR" -> pure RR
                        "OR" -> pure OR
                        "RD" -> pure RD
                        "MD" -> pure MD
                        "SMD" -> pure SMD
                        otherwise -> fail 
                         $ ForeignError "unknown effect measure type"

isRatio :: EffectMeasureType -> Boolean
isRatio RR  = true
isRatio OR  = true
isRatio RD  = false
isRatio MD  = false
isRatio SMD = false

-- EffectMeasureType <
