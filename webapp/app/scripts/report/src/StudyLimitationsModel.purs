module StudyLimitationsModel where

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
newtype RoBLevel = RoBLevel
  { id :: Int
  , color :: String
  , label :: String
  }
derive instance genericRoBLevel :: Rep.Generic RoBLevel _
instance showRoBLevel :: Show RoBLevel where
    show = genericShow
instance decodeRoBLevel :: Decode RoBLevel where
  decode = genericDecode opts
_RoBLevel :: Lens' RoBLevel (Record _)
_RoBLevel = lens (\(RoBLevel s) -> s) (\_ -> RoBLevel)

skeletonRoBLevel =  RoBLevel { id : 0
                             , color: "none"
                             , label: "none"
                             }
-- RoBLevel >


-- NetRobModel <
newtype NetRobModel = NetRobModel
  { status :: String
  , studyLimitations :: StudyLimitations
  }
derive instance genericNetRobModel :: Rep.Generic NetRobModel _
instance showNetRobModel :: Show NetRobModel where
    show = genericShow
instance decodeNetRobModel :: Decode NetRobModel where
  decode = genericDecode opts
_NetRobModel :: Lens' NetRobModel (Record _)
_NetRobModel = lens (\(NetRobModel s) -> s) (\_ -> NetRobModel)
studyLimitations :: forall a b r. Lens { studyLimitations :: a | r } { studyLimitations :: b | r } a b
studyLimitations = prop (SProxy :: SProxy "studyLimitations")
-- NetRobModel >

-- StudyLimitations <
newtype StudyLimitations = StudyLimitations
    { customized :: Number
    , rule :: String
    , status :: String
    , boxes :: Array NetRob
    }
derive instance genericStudyLimitations :: Rep.Generic StudyLimitations _
instance showStudyLimitations :: Show StudyLimitations where
    show = genericShow
instance decodeStudyLimitations :: Decode StudyLimitations where
  decode = genericDecode opts
_StudyLimitations :: Lens' StudyLimitations (Record _)
_StudyLimitations = lens (\(StudyLimitations s) -> s) (\_ -> StudyLimitations)
boxes :: forall a b r. Lens { boxes :: a | r } { boxes :: b | r } a b
boxes = prop (SProxy :: SProxy "boxes")
-- StudyLimitations >

-- NetRob <
newtype NetRob = NetRob
    { id :: String
    , judgement :: Int
    , rules :: Array RobRule
    , color :: String
    }
derive instance genericNetRob :: Rep.Generic NetRob _
instance showNetRob :: Show NetRob where
    show = genericShow
instance decodeNetRob :: Decode NetRob where
  decode p = do
    id <- p ! "id" >>= readString
    color <- p ! "color" >>= readString
    judgement <- do
      let sj = p ! "judgement" >>= readInt
      case runExcept sj of
           Left _ -> pure (-1)
           Right ij -> pure ij
    rules <- p ! "rules" >>= decode
    pure $ NetRob { id
                  , judgement
                  , rules
                  , color
                  }
_NetRob :: Lens' NetRob (Record _)
_NetRob = lens (\(NetRob s) -> s) (\_ -> NetRob)
rules :: forall a b r. Lens { rules :: a | r } { rules :: b | r } a b
rules = prop (SProxy :: SProxy "rules")
-- NetRob >

-- RobRule <
newtype RobRule = RobRule
    { id :: String
    , isActive :: Boolean
    , label :: String
    , name :: String
    , value :: Int
    }
derive instance genericRobRule :: Rep.Generic RobRule _
instance showRobRule :: Show RobRule where
    show = genericShow
instance decodeRobRule :: Decode RobRule where
  decode = genericDecode opts
_RobRule :: Lens' RobRule (Record _)
_RobRule = lens (\(RobRule s) -> s) (\_ -> RobRule)

skeletonRobRule = RobRule 
    { id : "Nothing"
    , isActive : false
    , label : "Nothing"
    , name : "Nothing"
    , value : 0
    }
-- RobRule >

