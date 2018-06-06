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

import Text.Model
import ComparisonModel
import StudyLimitationsModel
import IndirectnessModel
import InconsistencyModel
import ImprecisionModel
import PubbiasModel
import Report.Model

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
  , indirectness :: Indirectness
  , imprecision :: Imprecision
  , pubbias :: Pubbias
  , report :: Report
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
    imprecision <- p ! "imprecision" >>= decode
    indr <- p ! "indirectness"
    indirectness <- indr ! "netindr" >>= decode
    pubbias <- p ! "pubbias" >>= decode
    report <- p ! "report" >>= decode
    pure $ Project { title
                   , format
                   , "type" : tp
                   , creationDate
                   , accessDate
                   , studyLimitationLevels
                   , studies 
                   , "CM" : cm
                   , netRob 
                   , indirectness
                   , imprecision
                   , pubbias
                   , inconsistency 
                   , report}
_Project :: Lens' Project (Record _)
_Project = lens (\(Project s) -> s) (\_ -> Project)
netRob :: forall a b r. Lens { netRob :: a | r } { netRob :: b | r } a b
netRob = prop (SProxy :: SProxy "netRob")
inconsistency :: forall a b r. Lens { inconsistency :: a | r } { inconsistency :: b | r } a b
inconsistency = prop (SProxy :: SProxy "inconsistency")
imprecision :: forall a b r. Lens { imprecision :: a | r } { imprecision :: b | r } a b
imprecision = prop (SProxy :: SProxy "imprecision")
indirectness :: forall a b r. Lens { indirectness :: a | r } { indirectness :: b | r } a b
indirectness = prop (SProxy :: SProxy "indirectness")
pubbias :: forall a b r. Lens { pubbias :: a | r } { pubbias :: b | r } a b
pubbias = prop (SProxy :: SProxy "pubbias")
studies :: forall a b r. Lens { studies :: a | r } { studies :: b | r } a b
studies = prop (SProxy :: SProxy "studies")
cmContainer :: forall a b r. Lens { "CM" :: a | r } { "CM" :: b | r } a b
cmContainer = prop (SProxy :: SProxy "CM")

hasConMat :: State -> Boolean
hasConMat st = (st ^. _State <<< project <<< _Project 
                    <<< cmContainer <<< _CMContainer 
                    <<< currentCM <<< _ContributionMatrix)
                   ."status" == "ready"
-- Project >
-- Studies <
newtype Studies = Studies
  { directComparisons :: Array Comparison
  , indirectComparisons :: Array String
  , nodes :: Array Node 
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
  { status :: String
  , colNames :: Array String
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
params :: forall a b r. Lens { params :: a | r } { params :: b | r } a b
params = prop (SProxy :: SProxy "params")

getSelected :: State -> Array String
getSelected st = (st  ^. _State <<< project <<< _Project 
                 <<< cmContainer <<< _CMContainer
                 <<< currentCM <<< _ContributionMatrix)."selectedComparisons"
-- ContributionMatrix >

-- EffectMeasureType <
data EffectMeasureType = RR | OR | RD | MD | SMD

derive instance genericEffectMeasureType :: Rep.Generic EffectMeasureType _

instance showEffectMeasureType :: Show EffectMeasureType where
  show RR  = "RR"
  show OR  = "OR"
  show RD  = "RD"
  show MD  = "MD"
  show SMD = "SMD"

instance decodeEffectMeasureType :: Decode EffectMeasureType where
  decode = readEffectMeasureType

readEffectMeasureType :: Foreign -> F EffectMeasureType
readEffectMeasureType fem = do
  let mem = runExcept $ readString fem
  case mem  of 
       Left _ -> fail $ ForeignError "not a string"
       Right em -> case em of 
                        "RR" -> pure RR
                        "OR" -> pure OR
                        "RD" -> pure RD
                        "MD" -> pure MD
                        "SMD" -> pure SMD
                        otherwise -> fail 
                         $ ForeignError "unknown effect measure type"

isRatio :: EffectMeasureType -> Boolean
isRatio RR  = true
isRatio OR  = true
isRatio RD  = false
isRatio MD  = false
isRatio SMD = false

-- EffectMeasureType <

-- CMParameters <
newtype CMParameters = CMParameters
  { "MAModel" :: String
    , intvs :: Array String
    , rule :: String
    , sm :: EffectMeasureType
  }
derive instance genericCMParameters :: Rep.Generic CMParameters _
instance showCMParameters :: Show CMParameters where
    show = genericShow
instance decodeCMParameters :: Decode CMParameters where
  decode = genericDecode opts
_CMParameters :: Lens' CMParameters (Record _)
_CMParameters = lens (\(CMParameters s) -> s) (\_ -> CMParameters)

getEffectMeasureType :: State -> EffectMeasureType
getEffectMeasureType st = (st ^. _State <<< project <<< _Project 
                          <<< cmContainer <<< _CMContainer
                          <<< currentCM <<< _ContributionMatrix
                          <<< params <<< _CMParameters
                          )."sm"
-- CMParameters >

