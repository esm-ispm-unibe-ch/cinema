module Report.Model where

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

import StudyLimitationsModel
import ComparisonModel
import InconsistencyModel
import ImprecisionModel
import IndirectnessModel
import PubbiasModel

opts = defaultOptions { unwrapSingleConstructors = true }

newtype StudyLimitation = StudyLimitation
    { id :: String
    , customized :: Boolean
    , label :: String
    , value :: Int
    , rules :: Array RobRule
    , color :: String
    }
derive instance genericStudyLimitation :: Rep.Generic StudyLimitation _
instance showStudyLimitation :: Show StudyLimitation where
    show = genericShow
instance decodeStudyLimitation :: Decode StudyLimitation where
  decode = genericDecode opts
_StudyLimitation :: Lens' StudyLimitation (Record _)
_StudyLimitation = lens (\(StudyLimitation s) -> s) (\_ -> StudyLimitation)

skeletonStudyLimitation = StudyLimitation { id : "None"
                                          , customized : false
                                          , label : "--"
                                          , value : 0
                                          , rules : []
                                          , color : ""
                                          }


newtype ReportJudgement = ReportJudgement
  { selected :: ReportLevel
  , levels :: Array ReportLevel
  , reasons :: Array ReasonLevel
  }
derive instance genericReportJudgement :: Rep.Generic ReportJudgement _
instance showReportJudgement :: Show ReportJudgement where
    show = genericShow
instance decodeReportJudgement :: Decode ReportJudgement where
  decode = genericDecode opts
_ReportJudgement :: Lens' ReportJudgement (Record _)
_ReportJudgement = lens (\(ReportJudgement s) -> s) (\_ -> ReportJudgement)


newtype ReportRow = ReportRow 
  { id :: String
  , armA:: String
  , armB :: String
  , numberOfStudies :: Int
  , studyLimitation :: StudyLimitation
  , heterogeneity :: HeterogeneityBox
  , incoherence :: IncoherenceBox
  , judgement :: ReportJudgement
  , imprecision :: ImprecisionBox
  , indirectness :: IndirectnessBox
  , pubbias :: PubbiasBox
  }
derive instance genericReportRow :: Rep.Generic ReportRow _
instance showReportRow :: Show ReportRow where
    show = genericShow
instance decodeReportRow :: Decode ReportRow where
  decode = genericDecode opts
_ReportRow :: Lens' ReportRow (Record _)
_ReportRow = lens (\(ReportRow s) -> s) (\_ -> ReportRow)
judgement :: forall a b r. Lens { judgement :: a | r } { judgement :: b | r } a b
judgement = prop (SProxy :: SProxy "judgement")

newtype Report = Report
  { status :: String
  , hasChanged :: Boolean
  , directRows :: Array ReportRow
  , indirectRows :: Array ReportRow
  }
derive instance genericReport :: Rep.Generic Report _
instance showReport :: Show Report where
    show = genericShow
instance decodeReport :: Decode Report where
  decode = genericDecode opts
_Report :: Lens' Report (Record _)
_Report = lens (\(Report s) -> s) (\_ -> Report)
report :: forall a b r. Lens { report :: a | r } { report :: b | r } a b
report = prop (SProxy :: SProxy "report")

newtype ReportLevel = ReportLevel
  { id :: Int
  , color :: String
  , label :: String
  , selected :: Boolean
  }
derive instance genericReportLevel :: Rep.Generic ReportLevel _
instance showReportLevel :: Show ReportLevel where
    show = genericShow
instance decodeReportLevel :: Decode ReportLevel where
  decode = genericDecode opts
_ReportLevel :: Lens' ReportLevel (Record _)
_ReportLevel = lens (\(ReportLevel s) -> s) (\_ -> ReportLevel)

skeletonReportLevel :: ReportLevel
skeletonReportLevel = ReportLevel 
  { id : 666
  , color : "black"
  , label : "--"
  , selected : false
  }

newtype ReasonLevel = ReasonLevel
  { id :: Int
  , color :: String
  , label :: String
  , allowed :: Boolean
  , selected :: Boolean
  }
derive instance genericReasonLevel :: Rep.Generic ReasonLevel _
instance showReasonLevel :: Show ReasonLevel where
    show = genericShow
instance decodeReasonLevel :: Decode ReasonLevel where
  decode = genericDecode opts
_ReasonLevel :: Lens' ReasonLevel (Record _)
_ReasonLevel = lens (\(ReasonLevel s) -> s) (\_ -> ReasonLevel)

skeletonReasonLevel :: ReasonLevel
skeletonReasonLevel = ReasonLevel 
  { id : 666
  , color : "black"
  , label : "--"
  , allowed : true
  , selected : false
  }
