module ImprecisionModel where

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

-- Imprecision <
newtype Imprecision = Imprecision
    { status :: String
    , boxes :: Array ImprecisionBox
    }
_Imprecision :: Lens' Imprecision (Record _)
_Imprecision = lens (\(Imprecision s) -> s) (\_ -> Imprecision)
derive instance genericImprecision :: Rep.Generic Imprecision _
instance showImprecision :: Show Imprecision where
    show = genericShow
instance decodeImprecision :: Decode Imprecision where
  decode = genericDecode opts
-- Imprecision >

-- ImprecisionBox <
newtype ImprecisionBox = ImprecisionBox
    { id :: String
    , judgement :: Int
    , label :: String
    , levels :: Array ImprecisionLevel
    , color :: String
    , ruleLevel :: Int
    , customized :: Boolean
    }
_ImprecisionBox :: Lens' ImprecisionBox (Record _)
_ImprecisionBox = lens (\(ImprecisionBox s) -> s) (\_ -> ImprecisionBox)
derive instance genericImprecisionBox :: Rep.Generic ImprecisionBox _
instance showImprecisionBox :: Show ImprecisionBox where
    show = genericShow
skeletonImprecisionBox = ImprecisionBox { id : "None"
                                        , judgement : -1
                                        , label : "--"
                                        , levels : []
                                        , color : ""
                                        , ruleLevel : -1
                                        , customized : false
                                        }
instance decodeImprecisionBox :: Decode ImprecisionBox where
  decode p = do
    id <- p ! "id" >>= readString
    judgement <- p ! "judgement" >>= readInt
    ruleLevel <- p ! "ruleLevel" >>= readInt
    levels <- p ! "levels" >>= decode
    let color = ""
    let label = "--"
    customized <- pure false
    pure $ ImprecisionBox { id
                            , levels
                            , judgement
                            , ruleLevel
                            , label
                            , customized
                            , color }
imprecisionboxlabel :: forall a b r. Lens { label :: a | r } { label :: b | r } a b
imprecisionboxlabel = prop (SProxy :: SProxy "label")
imprecisionboxcolor :: forall a b r. Lens { color :: a | r } { color :: b | r } a b
imprecisionboxcolor = prop (SProxy :: SProxy "color")
imprecisionboxcustomized :: forall a b r. Lens { customized :: a | r } { customized :: b | r } a b
imprecisionboxcustomized = prop (SProxy :: SProxy "customized")


{--type StringComparisonIds = Array String--}
  
{--instance decodeStringComparisonIds :: Decode StringComparisonIds where--}
  {--decode = genericDecode opts--}
-- ImprecisionBox >


-- ImprecisionLevel <
newtype ImprecisionLevel = ImprecisionLevel
    { id :: Int
    , color :: String
    }
_ImprecisionLevel :: Lens' ImprecisionLevel (Record _)
_ImprecisionLevel = lens (\(ImprecisionLevel s) -> s) (\_ -> ImprecisionLevel)
derive instance genericImprecisionLevel :: Rep.Generic ImprecisionLevel _
instance showImprecisionLevel :: Show ImprecisionLevel where
    show = genericShow
instance decodeImprecisionLevel :: Decode ImprecisionLevel where
  decode p = do
    id <- p ! "id" >>= readInt
    color <- p ! "color" >>= readString
    pure $ ImprecisionLevel { id
                              , color }
-- ImprecisionLevel >
