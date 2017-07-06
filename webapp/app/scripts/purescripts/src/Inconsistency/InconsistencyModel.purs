module InconsistencyModel where

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

import ComparisonModel

opts = defaultOptions { unwrapSingleConstructors = true }

-- Inconsistency <
newtype Inconsistency = Inconsistency
    { route :: String
    , status :: String
    , incoherence :: Incoherence
    , heterogeneity :: Heterogeneity
    }
_Inconsistency :: Lens' Inconsistency (Record _)
_Inconsistency = lens (\(Inconsistency s) -> s) (\_ -> Inconsistency)
derive instance genericInconsistency :: Rep.Generic Inconsistency _
instance showInconsistency :: Show Inconsistency where
    show = genericShow
instance decodeInconsistency :: Decode Inconsistency where
  decode = genericDecode opts
incoherence :: forall a b r. Lens { incoherence :: a | r } { incoherence :: b | r } a b
incoherence = prop (SProxy :: SProxy "incoherence")
heterogeneity :: forall a b r. Lens { heterogeneity :: a | r } { heterogeneity :: b | r } a b
heterogeneity = prop (SProxy :: SProxy "heterogeneity")
-- Inconsistency >
-- Incoherence <
newtype Incoherence = Incoherence
    { status :: String
    , boxes :: Array IncoherenceBox
    }
_Incoherence :: Lens' Incoherence (Record _)
_Incoherence = lens (\(Incoherence s) -> s) (\_ -> Incoherence)
derive instance genericIncoherence :: Rep.Generic Incoherence _
instance showIncoherence :: Show Incoherence where
    show = genericShow
instance decodeIncoherence :: Decode Incoherence where
  decode = genericDecode opts
-- Incoherence >

-- IncoherenceBox <
newtype IncoherenceBox = IncoherenceBox
    { id :: String
    , judgement :: Int
    , label :: String
    , levels :: Array IncoherenceLevel
    , color :: String
    , ruleJudgement :: Int
    , customized :: Boolean
    }
_IncoherenceBox :: Lens' IncoherenceBox (Record _)
_IncoherenceBox = lens (\(IncoherenceBox s) -> s) (\_ -> IncoherenceBox)
derive instance genericIncoherenceBox :: Rep.Generic IncoherenceBox _
instance showIncoherenceBox :: Show IncoherenceBox where
    show = genericShow
instance decodeIncoherenceBox :: Decode IncoherenceBox where
  decode = genericDecode opts
skeletonIncoherenceBox = IncoherenceBox { id : "None"
                                        , judgement : -1
                                        , label : "--"
                                        , levels : []
                                        , color : ""
                                        , ruleJudgement : -1
                                        , customized : false
                                        }
-- IncoherenceBox >

-- IncoherenceLevel <
newtype IncoherenceLevel = IncoherenceLevel
    { id :: Int
    , label :: String
    , isActive :: Boolean
    , color :: String
    }
_IncoherenceLevel :: Lens' IncoherenceLevel (Record _)
_IncoherenceLevel = lens (\(IncoherenceLevel s) -> s) (\_ -> IncoherenceLevel)
derive instance genericIncoherenceLevel :: Rep.Generic IncoherenceLevel _
instance showIncoherenceLevel :: Show IncoherenceLevel where
    show = genericShow
instance decodeIncoherenceLevel :: Decode IncoherenceLevel where
  decode = genericDecode opts
-- IncoherenceLevel >


-- Heterogeneity <
newtype Heterogeneity = Heterogeneity
    { heters :: Heters
    , referenceValues :: ReferenceValues
    }
_Heterogeneity :: Lens' Heterogeneity (Record _)
_Heterogeneity = lens (\(Heterogeneity s) -> s) (\_ -> Heterogeneity)
derive instance genericHeterogeneity :: Rep.Generic Heterogeneity _
instance showHeterogeneity :: Show Heterogeneity where
    show = genericShow
instance decodeHeterogeneity :: Decode Heterogeneity where
  decode = genericDecode opts
heters :: forall a b r. Lens { heters :: a | r } { heters :: b | r } a b
heters = prop (SProxy :: SProxy "heters")
referenceValues :: forall a b r. Lens { referenceValues :: a | r } { referenceValues :: b | r } a b
referenceValues = prop (SProxy :: SProxy "referenceValues")
-- Heterogeneity >

newtype Heters = Heters
    { status :: String
    }
_Heters :: Lens' Heters (Record _)
_Heters = lens (\(Heters s) -> s) (\_ -> Heters)
derive instance genericHeters :: Rep.Generic Heters _
instance showHeters :: Show Heters where
    show = genericShow
instance decodeHeters :: Decode Heters where
  decode = genericDecode opts


newtype ReferenceValues = ReferenceValues
    { status :: String
    , treatments :: Array Node
    }
_ReferenceValues :: Lens' ReferenceValues (Record _)
_ReferenceValues = lens (\(ReferenceValues s) -> s) (\_ -> ReferenceValues)
derive instance genericReferenceValues :: Rep.Generic ReferenceValues _
instance showReferenceValues :: Show ReferenceValues where
    show = genericShow
instance decodeReferenceValues :: Decode ReferenceValues where
  decode = genericDecode opts
