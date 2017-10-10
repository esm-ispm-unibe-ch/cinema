module IndirectnessModel where

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

-- Indirectness <
newtype Indirectness = Indirectness
    { status :: String
    , boxes :: Array IndirectnessBox
    }
_Indirectness :: Lens' Indirectness (Record _)
_Indirectness = lens (\(Indirectness s) -> s) (\_ -> Indirectness)
derive instance genericIndirectness :: Rep.Generic Indirectness _
instance showIndirectness :: Show Indirectness where
    show = genericShow
instance decodeIndirectness :: Decode Indirectness where
  decode = genericDecode opts
-- Indirectness >

-- IndirectnessBox <
newtype IndirectnessBox = IndirectnessBox
    { id :: String
    , judgement :: Int
    , label :: String
    , levels :: Array IndirectnessLevel
    , color :: String
    , ruleLevel :: Int
    , customized :: Boolean
    }
_IndirectnessBox :: Lens' IndirectnessBox (Record _)
_IndirectnessBox = lens (\(IndirectnessBox s) -> s) (\_ -> IndirectnessBox)
derive instance genericIndirectnessBox :: Rep.Generic IndirectnessBox _
instance showIndirectnessBox :: Show IndirectnessBox where
    show = genericShow
skeletonIndirectnessBox = IndirectnessBox { id : "None"
                                        , judgement : -1
                                        , label : "--"
                                        , levels : []
                                        , color : ""
                                        , ruleLevel : -1
                                        , customized : false
                                        }
instance decodeIndirectnessBox :: Decode IndirectnessBox where
  decode p = do
    id <- p ! "id" >>= readString
    judgement <- p ! "judgement" >>= readInt
    ruleLevel <- p ! "ruleLevel" >>= readInt
    levels <- p ! "levels" >>= decode
    let color = ""
    let label = "--"
    customized <- pure false
    pure $ IndirectnessBox { id
                            , levels
                            , judgement
                            , ruleLevel
                            , label
                            , customized
                            , color }
indirectnessboxlabel :: forall a b r. Lens { label :: a | r } { label :: b | r } a b
indirectnessboxlabel = prop (SProxy :: SProxy "label")
indirectnessboxcolor :: forall a b r. Lens { color :: a | r } { color :: b | r } a b
indirectnessboxcolor = prop (SProxy :: SProxy "color")
indirectnessboxcustomized :: forall a b r. Lens { customized :: a | r } { customized :: b | r } a b
indirectnessboxcustomized = prop (SProxy :: SProxy "customized")


{--type StringComparisonIds = Array String--}
  
{--instance decodeStringComparisonIds :: Decode StringComparisonIds where--}
  {--decode = genericDecode opts--}
-- IndirectnessBox >


-- IndirectnessLevel <
newtype IndirectnessLevel = IndirectnessLevel
    { id :: Int
    , color :: String
    }
_IndirectnessLevel :: Lens' IndirectnessLevel (Record _)
_IndirectnessLevel = lens (\(IndirectnessLevel s) -> s) (\_ -> IndirectnessLevel)
derive instance genericIndirectnessLevel :: Rep.Generic IndirectnessLevel _
instance showIndirectnessLevel :: Show IndirectnessLevel where
    show = genericShow
instance decodeIndirectnessLevel :: Decode IndirectnessLevel where
  decode p = do
    id <- p ! "id" >>= readInt
    color <- p ! "color" >>= readString
    pure $ IndirectnessLevel { id
                              , color }
-- IndirectnessLevel >
