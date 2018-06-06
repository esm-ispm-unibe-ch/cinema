module InconsistencyModel where

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

import Text.Model
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
    , boxes :: Array HeterogeneityBox
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

newtype HeterogeneityBox = HeterogeneityBox
    { id :: String
    , judgement :: Int
    , label :: String
    , levels :: Array HeterogeneityLevel
    , color :: String
    , ruleLevel :: Int
    , customized :: Boolean
    }
_HeterogeneityBox :: Lens' HeterogeneityBox (Record _)
_HeterogeneityBox = lens (\(HeterogeneityBox s) -> s) (\_ -> HeterogeneityBox)
derive instance genericHeterogeneityBox :: Rep.Generic HeterogeneityBox _
instance showHeterogeneityBox :: Show HeterogeneityBox where
    show = genericShow
skeletonHeterogeneityBox = HeterogeneityBox { id : "None"
                                        , judgement : -1
                                        , label : "--"
                                        , levels : []
                                        , color : ""
                                        , ruleLevel : -1
                                        , customized : false
                                        }
{--instance decodeHeterogeneityBox :: Decode HeterogeneityBox where--}
  {--decode = genericDecode opts--}
instance decodeHeterogeneityBox :: Decode HeterogeneityBox where
  decode p = do
    id <- p ! "id" >>= readString
    judgement <- p ! "judgement" >>= readInt
    ruleLevel <- p ! "ruleLevel" >>= readInt
    levels <- p ! "levels" >>= decode
    let color = ""
    let label = "--"
    customized <- pure false
    pure $ HeterogeneityBox { id
                            , levels
                            , judgement
                            , ruleLevel
                            , label
                            , customized
                            , color }
heterboxlabel :: forall a b r. Lens { label :: a | r } { label :: b | r } a b
heterboxlabel = prop (SProxy :: SProxy "label")
heterboxcolor :: forall a b r. Lens { color :: a | r } { color :: b | r } a b
heterboxcolor = prop (SProxy :: SProxy "color")
heterboxcustomized :: forall a b r. Lens { customized :: a | r } { customized :: b | r } a b
heterboxcustomized = prop (SProxy :: SProxy "customized")


{--type StringComparisonIds = Array String--}
  
{--instance decodeStringComparisonIds :: Decode StringComparisonIds where--}
  {--decode = genericDecode opts--}


newtype HeterogeneityLevel = HeterogeneityLevel
    { id :: Int
    , color :: String
    }
_HeterogeneityLevel :: Lens' HeterogeneityLevel (Record _)
_HeterogeneityLevel = lens (\(HeterogeneityLevel s) -> s) (\_ -> HeterogeneityLevel)
derive instance genericHeterogeneityLevel :: Rep.Generic HeterogeneityLevel _
instance showHeterogeneityLevel :: Show HeterogeneityLevel where
    show = genericShow
{--instance decodeHeterogeneityLevel :: Decode HeterogeneityLevel where--}
  {--decode = genericDecode opts--}
instance decodeHeterogeneityLevel :: Decode HeterogeneityLevel where
  decode p = do
    id <- p ! "id" >>= readInt
    color <- p ! "color" >>= readString
    pure $ HeterogeneityLevel { id
                              , color }
