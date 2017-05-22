module Model where

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
import Data.Either (Either(..))
import Data.Int
import Data.Newtype
import Data.String as S
import Data.Symbol
import Data.Lens
import Data.Lens.Record (prop)
import Data.Lens.Zoom (Traversal, Traversal', Lens, Lens', zoom)
import Partial.Unsafe (unsafePartial)

import TextModel

opts = defaultOptions { unwrapSingleConstructors = true }

-- State <
newtype State = State
  { project :: Project
  , text :: TextContent
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
text :: forall a b r. Lens { text :: a | r } { text :: b | r } a b
text = prop (SProxy :: SProxy "text")

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
  , studyLimitationLevels :: Array RoBLevel
  , studies :: Studies
  , "CM" :: CMContainer
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
    studyLimitationLevels <- p ! "studyLimitationLevels" >>= decode
    studies <- p ! "studies" >>= decode
    cm <- p ! "CM" >>= decode
    netRob <- p ! "netRob" >>= decode
    inconsistency <- p ! "inconsistency" >>= decode
    pure $ Project { title
                   , format
                   , "type" : tp
                   , creationDate
                   , accessDate
                   , studyLimitationLevels
                   , studies 
                   , "CM" : cm
                   , netRob 
                   , inconsistency }
_Project :: Lens' Project (Record _)
_Project = lens (\(Project s) -> s) (\_ -> Project)
netRob :: forall a b r. Lens { netRob :: a | r } { netRob :: b | r } a b
netRob = prop (SProxy :: SProxy "netRob")
inconsistency :: forall a b r. Lens { inconsistency :: a | r } { inconsistency :: b | r } a b
inconsistency = prop (SProxy :: SProxy "inconsistency")
studies :: forall a b r. Lens { studies :: a | r } { studies :: b | r } a b
studies = prop (SProxy :: SProxy "studies")
cmContainer :: forall a b r. Lens { "CM" :: a | r } { "CM" :: b | r } a b
cmContainer = prop (SProxy :: SProxy "CM")
-- Project >

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

-- Studies <
newtype Studies = Studies
  { directComparisons :: Array Comparison
  , indirectComparisons :: Array String
  }
derive instance genericStudies :: Rep.Generic Studies _
instance showStudies :: Show Studies where
    show = genericShow
instance decodeStudies :: Decode Studies where
  decode = genericDecode opts
_Studies :: Lens' Studies (Record _)
_Studies = lens (\(Studies s) -> s) (\_ -> Studies)
directComparisons :: forall a b r. Lens { directComparisons :: a | r } {
  directComparisons :: b | r } a b
directComparisons = prop (SProxy :: SProxy "directComparisons" )
indirectComparisons :: forall a b r. Lens { indirectComparisons :: a | r } {
  indirectComparisons :: b | r } a b
indirectComparisons = prop (SProxy :: SProxy "indirectComparisons" )
-- Studies >


-- Comparison <
data TreatmentId = StringId String | IntId Int
instance showTreatmentId :: Show TreatmentId where
  show (StringId a) = show a
  show (IntId a) = show a

instance equalTreatmentId :: Eq TreatmentId where
  eq (StringId a) (StringId b)  = ((show a) == (show b))
  eq (IntId a) (IntId b)  = ((show a) == (show b))
  eq (StringId a) (IntId b)  = false
  eq (IntId a) (StringId b)  = false

instance orderTreatmentId :: Ord TreatmentId where
  compare (StringId a) (StringId b) = compare a b
  compare (IntId a) (IntId b) = compare a b
  compare (StringId a) (IntId b) = GT
  compare (IntId a) (StringId b) = LT

readTreatmentId :: Foreign -> F TreatmentId
readTreatmentId tid = do
  let sid = runExcept $ readString tid
  case sid of 
       Left _ -> do 
         let iid = runExcept $ readInt tid
         case iid of
             Left _ -> pure $ StringId "Error"
             Right oid -> IntId <$> (readInt tid)
       Right id -> StringId <$> (readString tid)

treatmentIdToString :: TreatmentId -> String
treatmentIdToString (StringId t) = t
treatmentIdToString (IntId t) = show t

newtype Comparison = Comparison
  { id :: String
  , t1 :: TreatmentId
  , t2 :: TreatmentId
  , numStudies :: Int
  }
derive instance genericComparison :: Rep.Generic Comparison _
instance showComparison :: Show Comparison where
    show = genericShow
instance decodeComparison :: Decode Comparison where
  decode c = do
    id <- c ! "id" >>= readString
    t1 <- c ! "t1" >>= readTreatmentId
    t2 <- c ! "t2" >>= readTreatmentId
    numStudies <- c ! "numStudies" >>= readInt
    pure $ Comparison { id
                      , t1
                      , t2
                      , numStudies
                      }

_Comparison :: Lens' Comparison (Record _)
_Comparison = lens (\(Comparison s) -> s) (\_ -> Comparison)

skeletonComparison :: Comparison
skeletonComparison = Comparison { id : "none:none"
                                , t1 : StringId "none"
                                , t2 : StringId "none"
                                , numStudies : 0
                                }

stringToTreatmentId :: String -> TreatmentId
stringToTreatmentId str = do
   let sint = fromString str
   case sint of
     Just sint -> IntId sint
     Nothing ->  StringId str
  
stringToComparison :: String -> String -> Comparison
stringToComparison del str = do
  let sid = S.split (S.Pattern del) str
  if (length sid == 2)
     then let st1 = stringToTreatmentId 
                       (unsafePartial $ fromJust $ head sid)
              st2 = stringToTreatmentId 
                       (unsafePartial $ fromJust $ last sid)

            in Comparison { id : str
                       , t1 : min st1 st2                     
                       , t2 : max st1 st2                       
                       , numStudies : 0
                     }
     else Comparison $ (skeletonComparison ^. _Comparison) { id = str }

-- Comparison >

-- CMContainer <
newtype CMContainer = CMContainer
  { currentCM :: ContributionMatrix
  }
derive instance genericCMContainer :: Rep.Generic CMContainer _
instance showCMContainer :: Show CMContainer where
    show = genericShow
instance decodeCMContainer :: Decode CMContainer where
  decode = genericDecode opts
_CMContainer :: Lens' CMContainer (Record _)
_CMContainer = lens (\(CMContainer s) -> s) (\_ -> CMContainer)
currentCM :: forall a b r. Lens { currentCM :: a | r } { currentCM :: b | r } a b
currentCM = prop (SProxy :: SProxy "currentCM" )
-- CMContainer >

-- ContributionMatrix <
newtype ContributionMatrix = ContributionMatrix
  { colNames :: Array String
  , directRowNames :: Array String
  , indirectRowNames :: Array String
  , params :: CMParameters 
  , selectedComparisons :: Array String
  }
derive instance genericContributionMatrix :: Rep.Generic ContributionMatrix _
instance showContributionMatrix :: Show ContributionMatrix where
    show = genericShow
instance decodeContributionMatrix :: Decode ContributionMatrix where
  decode = genericDecode opts
_ContributionMatrix :: Lens' ContributionMatrix (Record _)
_ContributionMatrix = lens (\(ContributionMatrix s) -> s) (\_ -> ContributionMatrix)
-- ContributionMatrix >

-- CMParameters <
newtype CMParameters = CMParameters
  { "MAModel" :: String
    , intvs :: Array String
    , rule :: String
    , sm :: String
  }
derive instance genericCMParameters :: Rep.Generic CMParameters _
instance showCMParameters :: Show CMParameters where
    show = genericShow
instance decodeCMParameters :: Decode CMParameters where
  decode = genericDecode opts
_CMParameters :: Lens' CMParameters (Record _)
_CMParameters = lens (\(CMParameters s) -> s) (\_ -> CMParameters)
-- CMParameters >

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

-- Various <
type Imprecision = String
type Heterogeneity = String
type Incoherence = String
type Indirectness = String
type PubBias = String
-- Various >

-- NetRob <
newtype NetRob = NetRob
    { id :: String
    , judgement :: Int
    , rules :: Array RobRule
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
  { status :: String
  }
derive instance genericReport :: Rep.Generic Report _
instance showReport :: Show Report where
    show = genericShow
instance decodeReport :: Decode Report where
  decode = genericDecode opts
_Report :: Lens' Report (Record _)
_Report = lens (\(Report s) -> s) (\_ -> Report)

skeletonReport :: Report
skeletonReport = Report 
  { status : "ready"
  }

-- Report >
