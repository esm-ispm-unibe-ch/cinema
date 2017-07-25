module Report.View where

import Prelude
import Control.Monad.Eff 
import Control.Monad.Eff.Unsafe
import Control.Monad.Eff.Console (CONSOLE, log, logShow)
import Data.Array
import Data.String as S
import Data.Foreign (Foreign)
import Data.Foreign.Class (class Decode, encode, decode)
import Data.Foreign.Index ((!))
import Data.Foreign.Generic (defaultOptions, genericDecode, genericDecodeJSON)
import Data.Generic.Rep as Rep 
import Data.Generic.Rep.Show (genericShow)
import Control.Monad.Except (runExcept)
import Data.Function
import Data.Maybe
import Data.Either (Either(..))
import Data.Traversable
import Text.Handlebars (compile)
import Data.Lens 
import Data.Lens.Index
import Data.Lens.Record
import Data.Lens.Traversal
import Text.Smolder.Renderer.String (render) as S 
import Partial.Unsafe (unsafePartial)

import Report.Template as T
import ComparisonModel
import StudyLimitationsModel
import InconsistencyModel
import Model
import Text.Model
import Report.Model

opts = defaultOptions { unwrapSingleConstructors = true }

-- StudyLimitation <
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

register :: forall e. Foreign -> Unit
register s = unit

isReady :: State -> Boolean
isReady s =
  (hasIncoherence s) ||
  (hasStudyLimitations s) || 
  (hasHeterogeneity s)

type ViewModel r = 
  { isReady :: Boolean
  , directRows :: Array ReportRow
  , indirectRows :: Array ReportRow
  , hasDirects :: Boolean
  , hasIndirects :: Boolean
  , hasStudyLimitations :: Boolean
  , hasIncoherence :: Boolean
  , studyLimitationsRule :: RobRule
  | r
  }

getReportLevels :: State -> Array ReportLevel
getReportLevels st =
  let levelsText = (st ^. _State <<< text <<< _TextContent
                 <<< reportText <<< _ReportText)."levels"
      defaultLevels = [ { id: 0
                        , label: ""
                        , color: "#7CC9AE"
                        , isActive: false
                        }
                      , { id: -1
                        , label: ""
                        , color: "#0C8CE7"
                        , isActive: false
                        }
                      , { id: -2
                        , label: ""
                        , color: "#FBBC05"
                        , isActive: false
                        }
                      , { id: -2
                        , label: ""
                        , color: "#E0685C"
                        , isActive: false
                        }
                      ]
      levels = map (\i -> do
                     let l = defaultLevels !! i
                         ol = case l of 
                           Just dl -> dl
                           Nothing -> skeletonReportLevel ^. _ReportLevel
                         lb = levelsText !! i
                         label = case lb of
                           Just l -> l
                           Nothing -> "UNKNOWN"
                     ReportLevel $ ol { label = label }
                   )
                   $ 0..3
  in levels

type ReportRow = 
  { id :: String
  , armA:: String
  , armB :: String
  , numberOfStudies :: Int
  , studyLimitation :: StudyLimitation
  , heterogeneity :: HeterogeneityBox
  , incoherence :: IncoherenceBox
  , levels :: Array ReportLevel
  , judgement :: ReportLevel
  {--, imprecision :: Maybe Imprecision--}
  {--, heterogeneity :: Maybe Heterogeneity--}
  {--, indirectness :: Maybe Indirectness--}
  {--, pubBias :: Maybe PubBias--}
  }

hasDirects :: State -> Boolean
hasDirects st = length (directRows st) > 0

hasIndirects :: State -> Boolean
hasIndirects st = length (indirectRows st) > 0

hasIncoherence :: State -> Boolean
hasIncoherence st = (st ^. _State <<< project <<< _Project 
                    <<< inconsistency <<< _Inconsistency 
                    <<< incoherence <<< _Incoherence)
                   ."status" == "ready"

hasHeterogeneity :: State -> Boolean
hasHeterogeneity st = (st ^. _State <<< project <<< _Project 
                    <<< inconsistency <<< _Inconsistency 
                    <<< heterogeneity <<< _Heterogeneity
                    <<< heters <<< _Heters)
                   ."status" == "ready"

hasStudyLimitations :: State -> Boolean
hasStudyLimitations st = (st ^. _State <<< project <<< _Project 
                 <<< netRob <<< _NetRobModel 
                 <<< studyLimitations <<< _StudyLimitations)
                 ."status" == "ready"

getDirects :: State -> Array Comparison
getDirects st = 
  let directs = st ^. _State <<< project <<< _Project 
                 <<< studies <<< _Studies
                 <<< directComparisons 
                 in (sortBy comparisonsOrdering directs)

getIndirects :: State -> Array Comparison
getIndirects st = 
  let indirects = st ^. _State <<< project <<< _Project 
                 <<< studies <<< _Studies
                 <<< indirectComparisons 
     in (sortBy comparisonsOrdering (map (stringToComparison ",") indirects))


getStudyLimitations :: State -> Array NetRob
getStudyLimitations st = st  ^. _State <<< project <<< _Project 
                 <<< netRob <<< _NetRobModel
                 <<< studyLimitations <<< _StudyLimitations
                 <<< boxes

getStudyLimitationsRule :: State -> RobRule
getStudyLimitationsRule st = do 
  let rule = (st  ^. _State <<< project <<< _Project 
                 <<< netRob <<< _NetRobModel
                 <<< studyLimitations <<< _StudyLimitations)."rule"
      rulesTexts = st ^. _State <<< text <<< _TextContent
                 <<< netRobText <<< _NetRobText
                 <<< netRobRulesText
      label' = getNetRobRuleText rule rulesTexts
  RobRule ( (skeletonRobRule ^. _RobRule) { id = rule, label = label' })

getStudyLimitationLevels :: State -> Array RoBLevel
getStudyLimitationLevels st = (st  ^. _State <<< project <<< _Project)
                              ."studyLimitationLevels"

isCustomized :: NetRob -> RobRule -> Boolean
isCustomized comp rl = do
  let rule = (rl ^. _RobRule)."id"
      value = (comp ^. _NetRob)."judgement"
      activeRule = find (\r -> rule == (r ^. _RobRule)."id") 
        $ (comp ^. _NetRob)."rules" 
      ruleValue = case activeRule of
         Just ar -> (ar ^. _RobRule)."value" 
         Nothing -> 0
  value /= ruleValue

getStudyLimitation :: State -> Comparison -> StudyLimitation
getStudyLimitation st c = do
  if hasStudyLimitations st then
    let rob = find (\sl -> 
              isIdOfComparison (sl ^. _NetRob)."id" c
              ) $ getStudyLimitations st
        level = case rob of
                     Just r -> find (\slv -> 
                              (slv ^. _RoBLevel)."id" 
                              == (r ^. _NetRob)."judgement"
                              ) $ getStudyLimitationLevels st
                     Nothing -> Nothing

        in case level of 
                Just l -> StudyLimitation { 
                          id : 
                            ((unsafePartial $ fromJust rob) ^. _NetRob)."id"
                           , customized : isCustomized
                            (unsafePartial $ fromJust rob)
                            (getStudyLimitationsRule st)
                           , label : (l ^. _RoBLevel)."label"
                           , value :
                             ((unsafePartial $ fromJust rob) ^.
                             _NetRob)."judgement"
                           , rules :
                             ((unsafePartial $ fromJust rob) ^. _NetRob)."rules"
                           , color :
                             ((unsafePartial $ fromJust rob) ^. _NetRob)."color"
                           }
                Nothing -> skeletonStudyLimitation
    else
    skeletonStudyLimitation


getIncoherence :: State -> Comparison -> IncoherenceBox
getIncoherence st c = do
  let incoherences = st  ^. _State <<< project <<< _Project 
                     <<< inconsistency <<< _Inconsistency
                     <<< incoherence <<< _Incoherence
                     <<< boxes
  if hasIncoherence st then
    let rob = find (\ib -> 
              isIdOfComparison (ib ^. _IncoherenceBox)."id" c
              ) incoherences 
     in case rob of
                 Just r -> r
                 Nothing -> skeletonIncoherenceBox
    else
    skeletonIncoherenceBox

getHeterogeneity :: State -> Comparison -> HeterogeneityBox
getHeterogeneity st c = do
  let heterboxes = st  ^. _State <<< project <<< _Project 
                     <<< inconsistency <<< _Inconsistency
                     <<< heterogeneity <<< _Heterogeneity
                     <<< heters <<< _Heters
                     <<< boxes
  if hasHeterogeneity st then
    let mbox = find (\ib -> 
              isIdOfComparison (ib ^. _HeterogeneityBox)."id" c
              ) heterboxes 
        levelsText = (st ^. _State <<< text <<< _TextContent
                     <<< heterogeneityText <<< _HeterogeneityText)."levels"
        getcolor = do
           case mbox of 
               Nothing -> "grey"
               Just box -> let mlevel = (box ^. _HeterogeneityBox)."levels" !! 
                                        ((box ^. _HeterogeneityBox)."judgement"
                                        - 1)
                             in case mlevel of 
                                   Nothing -> "grey"
                                   Just level -> (level ^.
                                   _HeterogeneityLevel)."color"
        getLabel = do 
          case mbox of 
               Nothing -> "error"
               Just box -> let mlabel = levelsText !!
                                        ((box ^. _HeterogeneityBox)."judgement"
                                        - 1)
                             in case mlabel of 
                                   Nothing -> "error"
                                   Just label -> label
        getCustomized = do
          case mbox of
               Nothing -> false
               Just box -> 
                 (box ^. _HeterogeneityBox)."judgement" /= 
                   (box ^. _HeterogeneityBox)."ruleLevel"
     in case mbox of
                 Nothing -> skeletonHeterogeneityBox
                 Just r -> (_HeterogeneityBox <<< heterboxcustomized .~
                 getCustomized) (
                           (_HeterogeneityBox <<< heterboxcolor .~ getcolor)(
                  _HeterogeneityBox <<< heterboxlabel .~ getLabel $ r)
                  )
    {--let label = let level = find (\l -> (l ^. _HeterogeneityLevel)."id" == judgement)--}
    {--                  levels--}
    {--                        in case level of--}
    {--                           Nothing -> "--"--}
    {--                           Just lvl -> (lvl ^. _HeterogeneityLevel)."label"--}
    else
    skeletonHeterogeneityBox

getRows :: State -> Array Comparison -> Array ReportRow
getRows a comps = 
  let selects = getSelected a
      rows =  map (\s -> 
             let c = s ^. _Comparison 
             in { id : c."id"
             , armA : show (min c."t1" c."t2")
             , armB : show (max c."t1" c."t2")
             , numberOfStudies: c."numStudies"
             , levels : getReportLevels a
             , studyLimitation: getStudyLimitation a s
             , heterogeneity: getHeterogeneity a s
             , incoherence: getIncoherence a s
             , judgement: skeletonReportLevel
             }) 
             $ filter (isSelectedComparison selects) comps
      in rows

directRows :: State -> Array ReportRow 
directRows a = getRows a $ getDirects a

indirectRows :: State -> Array ReportRow 
indirectRows a = getRows a $ getIndirects a  

template :: State -> String
template a = 
    let b :: ViewModel ( project :: Project )
        b = { project : a ^. _State  <<< project
            , isReady : isReady a 
            , directRows : directRows a
            , indirectRows : indirectRows a
            , hasDirects : hasDirects a
            , hasIndirects : hasIndirects a
            , hasStudyLimitations : hasStudyLimitations a
            , hasIncoherence : hasIncoherence a
            , studyLimitationsRule : getStudyLimitationsRule a
          }
        viewData = b
    in compile T.template viewData

errorTemplate :: forall a. a -> String
errorTemplate = compile "<div class='error-cont error col-md-offset-1 \
  \ col-md-10'> {{{.}}} </div>"
