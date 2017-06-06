module ClinImp.Model where

import Prelude
import Control.Monad.Eff 
import Data.Foreign 
import Data.Foreign.Class (class Decode, encode, decode)
import Data.Foreign.Index ((!))
import Data.Foreign.Generic (defaultOptions, genericDecode, genericDecodeJSON)
import Data.Generic.Rep as Rep 
import Data.Generic.Rep.Show (genericShow)
import Control.Monad.Except (runExcept)
import Data.Maybe (Maybe(..))
import Data.Either (Either(..))
import Data.Int
import Data.Newtype
import Data.Symbol
import Data.Lens
import Data.Lens.Record (prop)
import Data.Lens.Zoom (Traversal, Traversal', Lens, Lens', zoom)

import Model

opts = defaultOptions { unwrapSingleConstructors = true }


-- ClinImp <
newtype ClinImp = ClinImp
  { status :: String
  , question :: String
  , threshold :: Number
  , emtype :: EffectMeasureType
  }
derive instance genericClinImp :: Rep.Generic ClinImp _
instance showClinImp :: Show ClinImp where
    show = genericShow
instance decodeClinImp :: Decode ClinImp where
  decode = genericDecode opts
_ClinImp :: Lens' ClinImp (Record _)
_ClinImp = lens (\(ClinImp s) -> s) (\_ -> ClinImp)

getDefaultThreshold :: EffectMeasureType -> Number
getDefaultThreshold RR = 1.0
getDefaultThreshold OR = 1.0
getDefaultThreshold RD = 0.0
getDefaultThreshold MD = 0.0
getDefaultThreshold SMD = 0.0

emptyClinImp :: ClinImp
emptyClinImp = ClinImp 
  { status : "not_ready"
  , question : "Define threshold of clinical importance"
  , threshold : 66.6
  , emtype : RR
  }

skeletonClinImp :: EffectMeasureType -> ClinImp
skeletonClinImp m = ClinImp 
  { status : "ready"
  , question : "Define threshold of clinical importance"
  , threshold : getDefaultThreshold m
  , emtype : m
  }
-- ClinImp >
