module Model where

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

-- State <
newtype State = State
  { project :: Project
  }
_State :: Lens' State (Record _)
_State = lens (\(State s) -> s) (\_ -> State)
derive instance genericState :: Rep.Generic State _
instance showState :: Show State where
    show = genericShow
instance decodeState :: Decode State where
  decode = genericDecode opts
getState :: Foreign -> F State
getState = genericDecode opts 
project :: forall a b r. Lens { project :: a | r } { project :: b | r } a b
project = prop (SProxy :: SProxy "project")

readState :: Foreign -> Either String State
readState m = do
  let rs = runExcept $ getState m 
  case rs of 
   Left a -> Left (show a) 
   Right b -> Right b
-- State >

-- Project <
newtype Project = Project
  { title :: String
  , format :: String
  , "type" :: String
  , accessDate :: Int
  , creationDate :: Int
  , netRob :: NetRobModel
  , inconsistency :: Inconsistency
  }
derive instance genericProject :: Rep.Generic Project _
instance showProject :: Show Project where
    show = genericShow
instance decodeProject :: Decode Project where
  decode p = do
    title <- p ! "title" >>= readString
    format <- p ! "format" >>= readString
    tp <- p ! "type" >>= readString
    creationDate <- pure floor <*> ( p ! "creationDate" >>= readNumber )
    accessDate <- pure floor <*> ( p ! "accessDate" >>= readNumber)
    netRob <- p ! "netRob" >>= decode
    inconsistency <- p ! "inconsistency" >>= decode
    pure $ Project { title, format, "type" : tp,  creationDate, accessDate,
                   netRob ,inconsistency }
_Project :: Lens' Project (Record _)
_Project = lens (\(Project s) -> s) (\_ -> Project)
netRob :: forall a b r. Lens { netRob :: a | r } { netRob :: b | r } a b
netRob = prop (SProxy :: SProxy "netRob")
inconsistency :: forall a b r. Lens { inconsistency :: a | r } { inconsistency :: b | r } a b
inconsistency = prop (SProxy :: SProxy "inconsistency")
-- Project >

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
    , rules :: Array RobRules
    }
derive instance genericNetRob :: Rep.Generic NetRob _
instance showNetRob :: Show NetRob where
    show = genericShow
instance decodeNetRob :: Decode NetRob where
  decode = genericDecode opts
_NetRob :: Lens' NetRob (Record _)
_NetRob = lens (\(NetRob s) -> s) (\_ -> NetRob)
rules :: forall a b r. Lens { rules :: a | r } { rules :: b | r } a b
rules = prop (SProxy :: SProxy "rules")
-- NetRob >

-- RobRules <
newtype RobRules = RobRules
    { id :: String
    , isActive :: Boolean
    , label :: String
    , name :: String
    , value :: Int
    }
derive instance genericRobRules :: Rep.Generic RobRules _
instance showRobRules :: Show RobRules where
    show = genericShow
instance decodeRobRules :: Decode RobRules where
  decode = genericDecode opts
_RobRules :: Lens' RobRules (Record _)
_RobRules = lens (\(RobRules s) -> s) (\_ -> RobRules)
-- RobRules >

-- Inconsistency <
newtype Inconsistency = Inconsistency
    { route :: String
    , status :: String
    }
_Inconsistency :: Lens' Inconsistency (Record _)
_Inconsistency = lens (\(Inconsistency s) -> s) (\_ -> Inconsistency)
derive instance genericInconsistency :: Rep.Generic Inconsistency _
instance showInconsistency :: Show Inconsistency where
    show = genericShow
instance decodeInconsistency :: Decode Inconsistency where
  decode = genericDecode opts
-- Inconsistency >

-- Report <
newtype Report = Report
  { id :: Int
  }
derive instance genericReport :: Rep.Generic Report _
instance showReport :: Show Report where
    show = genericShow
instance decodeReport :: Decode Report where
  decode = genericDecode opts

skeletonReport :: Report
skeletonReport = Report{
  id : 49
}
-- Report >
foreign import data Model :: Type


foreign import data SAVE_STATE :: Effect

foreign import data GET_STATE :: Effect

foreign import setState :: forall eff. 
                            Report -> 
                            Eff ( model :: SAVE_STATE | eff) Unit
