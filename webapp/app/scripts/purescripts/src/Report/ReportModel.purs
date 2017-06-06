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

opts = defaultOptions { unwrapSingleConstructors = true }

-- Report <
newtype Report = Report
  { status :: String
  , levels :: Array ReportLevel
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
  , levels : []
  }
-- Report >

-- ReportLevel <
newtype ReportLevel = ReportLevel
  { id :: Int
  , color :: String
  , label :: String
  , isActive :: Boolean
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
  , color : ""
  , label : "--"
  , isActive : false
  }

-- ReportLevel >
