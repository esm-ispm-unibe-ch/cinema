module TextModel where

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

opts = defaultOptions { unwrapSingleConstructors = true }

-- RoBLevel <
newtype TextContent = TextContent
  { "NetRob" :: NetRobText
  , errorPage :: String
  }
derive instance genericTextContent :: Rep.Generic TextContent _
instance showTextContent :: Show TextContent where
    show = genericShow
instance decodeTextContent :: Decode TextContent where
  decode = genericDecode opts
_TextContent :: Lens' TextContent (Record _)
_TextContent = lens (\(TextContent s) -> s) (\_ -> TextContent)

netRobText :: forall a b r. Lens { "NetRob" :: a | r } { "NetRob" :: b | r } a b
netRobText = prop (SProxy :: SProxy "NetRob")
-- TextContent >

-- NetRobText <
newtype NetRobText = NetRobText 
  { rules :: RuleTexts
  }
derive instance genericNetRobText :: Rep.Generic NetRobText _
instance showNetRobText :: Show NetRobText where
    show = genericShow
instance decodeNetRobText :: Decode NetRobText where
  decode = genericDecode opts
_NetRobText :: Lens' NetRobText (Record _)
_NetRobText = lens (\(NetRobText s) -> s) (\_ -> NetRobText)

netRobRulesText :: forall a b r. Lens { rules :: a | r } { rules :: b | r } a b
netRobRulesText = prop (SProxy :: SProxy "rules")
--NetRobText >

-- RuleTextx <
newtype RuleTexts = RuleTexts 
  { majRule :: String
  , maxRule :: String
  , meanRule :: String
  , noRule :: String
  }
derive instance genericRuleTexts :: Rep.Generic RuleTexts _
instance showRuleTexts :: Show RuleTexts where
    show = genericShow
instance decodeRuleTexts :: Decode RuleTexts where
  decode = genericDecode opts
_RuleTexts :: Lens' RuleTexts (Record _)
_RuleTexts = lens (\(RuleTexts s) -> s) (\_ -> RuleTexts)

getNetRobRuleText :: String -> RuleTexts -> String
getNetRobRuleText rule texts = do
  let tr = texts ^. _RuleTexts
  let ruletext = case rule of 
       "majRule" -> tr."majRule"
       "maxRule" -> tr."maxRule"
       "meanRule" -> tr."meanRule"
       otherwise -> tr."noRule"
  ruletext

  

-- RuleTextx >
