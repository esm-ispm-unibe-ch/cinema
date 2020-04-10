module PubbiasModel where

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

-- Pubbias <
newtype Pubbias = Pubbias
    { status :: String
    , boxes :: Array PubbiasBox
    }
_Pubbias :: Lens' Pubbias (Record _)
_Pubbias = lens (\(Pubbias s) -> s) (\_ -> Pubbias)
derive instance genericPubbias :: Rep.Generic Pubbias _
instance showPubbias :: Show Pubbias where
    show = genericShow
instance decodePubbias :: Decode Pubbias where
  decode = genericDecode opts
-- Pubbias >

-- PubbiasBox <
newtype PubbiasBox = PubbiasBox
    { id :: String
    , judgement :: Int
    , label :: String
    , levels :: Array PubbiasLevel
    , color :: String
    , ruleLevel :: Int
    , customized :: Boolean
    }
_PubbiasBox :: Lens' PubbiasBox (Record _)
_PubbiasBox = lens (\(PubbiasBox s) -> s) (\_ -> PubbiasBox)
derive instance genericPubbiasBox :: Rep.Generic PubbiasBox _
instance showPubbiasBox :: Show PubbiasBox where
    show = genericShow
skeletonPubbiasBox = PubbiasBox { id : "None"
                                        , judgement : -1
                                        , label : "--"
                                        , levels : []
                                        , color : ""
                                        , ruleLevel : -1
                                        , customized : false
                                        }
instance decodePubbiasBox :: Decode PubbiasBox where
  decode p = do
    id <- p ! "id" >>= readString
    judgement <- p ! "judgement" >>= readInt
    levels <- p ! "levels" >>= decode
    let color = ""
    let label = "--"
    customized <- pure false
    pure $ PubbiasBox { id
                            , levels
                            , judgement
                            , ruleLevel: -1
                            , label
                            , customized
                            , color }
pubbiasboxlabel :: forall a b r. Lens { label :: a | r } { label :: b | r } a b
pubbiasboxlabel = prop (SProxy :: SProxy "label")
pubbiasboxcolor :: forall a b r. Lens { color :: a | r } { color :: b | r } a b
pubbiasboxcolor = prop (SProxy :: SProxy "color")
pubbiasboxcustomized :: forall a b r. Lens { customized :: a | r } { customized :: b | r } a b
pubbiasboxcustomized = prop (SProxy :: SProxy "customized")


{--type StringComparisonIds = Array String--}
  
{--instance decodeStringComparisonIds :: Decode StringComparisonIds where--}
  {--decode = genericDecode opts--}
-- PubbiasBox >


-- PubbiasLevel <
newtype PubbiasLevel = PubbiasLevel
    { id :: Int
    , color :: String
    }
_PubbiasLevel :: Lens' PubbiasLevel (Record _)
_PubbiasLevel = lens (\(PubbiasLevel s) -> s) (\_ -> PubbiasLevel)
derive instance genericPubbiasLevel :: Rep.Generic PubbiasLevel _
instance showPubbiasLevel :: Show PubbiasLevel where
    show = genericShow
instance decodePubbiasLevel :: Decode PubbiasLevel where
  decode p = do
    id <- p ! "id" >>= readInt
    color <- p ! "color" >>= readString
    pure $ PubbiasLevel { id
                              , color }
-- PubbiasLevel >
