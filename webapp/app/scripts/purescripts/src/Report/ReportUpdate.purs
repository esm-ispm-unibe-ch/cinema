module Report.Update where

import Prelude
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, log, logShow)
import Data.Foreign
import Data.Maybe (Maybe(..))
import Data.Either (Either(..))
import Data.Traversable
import Data.Lens
import Data.Lens.Record (prop)
import Data.Lens.Zoom (Traversal, Traversal', Lens, Lens', zoom)
import Data.Array
import Partial.Unsafe (unsafePartial)
import Data.Maybe (fromJust)

import Model
import Text.Model
import StudyLimitationsModel
import ComparisonModel
import InconsistencyModel
import ImprecisionModel
import IndirectnessModel
import PubbiasModel
import SaveModel
import UpdateJudgement
import Report.Model
import ResetJudgements
import DownloadJudgements

updateState :: forall eff. Foreign 
  -> Eff (console :: CONSOLE 
         , modelOut :: SAVE_STATE 
         | eff
         ) Unit
updateState mdl = do
  let (s :: Either String State) = readState mdl
  case s of
    Left err -> do saveState "report" emptyReport
                   {--logShow $ "reading state in Report error: " <> err--}
    Right st -> do
      if isReady st then do
        if hasChanged st then do
          logShow $ "report already ocupied"
          else do
            saveState "report" (skeletonReport st)
            {--logShow $ "filling skeletonReport report"--}
            {--logShow $ getJudgementDebug st--}
        else do
          saveState "report" emptyReport
          {--logShow $ "Report Not Ready"--}

emptyReport :: Report
emptyReport = Report 
  { status : "notReady"
  , hasChanged: false
  , directRows : []
  , indirectRows : []
  }

skeletonReport :: State -> Report
skeletonReport st = Report 
  { status : "ready"
  , hasChanged: false
  , directRows : directRows st
  , indirectRows : indirectRows st
  }

isReady :: State -> Boolean
isReady s =
  (hasStudyLimitations s) || 
  (hasImprecision s) ||
  (hasIncoherence s) ||
  (hasIndirectness s) ||
  (hasPubbias s) ||
  (hasHeterogeneity s)

hasChanged :: State -> Boolean
hasChanged st = (st ^. _State 
  <<< project <<< _Project 
  <<< report <<< _Report)."hasChanged"

updateReportJudgement :: forall e. Foreign 
  -> Eff ( console :: CONSOLE
         , updateMe :: UPDATE_JUDGEMENT 
         | e) Unit
updateReportJudgement a = do
  updateJudgement a
  logShow $ "updated judgement"

{--resetJudgements :: forall eff. Foreign --}
  {---> Eff (console :: CONSOLE --}
         {--, updateJudgs :: RESET_JUDGEMENTS --}
         {--| eff--}
         {--) Unit--}
{--resetJudgements = resetJudgements--}

resetAll = resetJudgements

download = downloadJudgements

hasJudgements :: State -> Boolean
hasJudgements st = (st ^. _State <<< project <<< _Project 
                    <<< report <<< _Report)
                   ."status" == "ready"

defaultJudgement :: State 
                 -> ReportJudgement
defaultJudgement st =
  let levelsText = (st ^. _State <<< text <<< _TextContent
                 <<< reportText <<< _ReportText)."levels"
      defaultLevels = [ { id: 0
                        , label: ""
                        , color: "#02c000"
                        , selected: true
                        }
                      , { id: -1
                        , label: ""
                        , color: "#0C8CE7"
                        , selected: false
                        }
                      , { id: -2
                        , label: ""
                        , color: "#e0df02"
                        , selected: false
                        }
                      , { id: -3
                        , label: ""
                        , color: "#c00000"
                        , selected: false
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
      getSelected :: Array ReportLevel ->  ReportLevel
      getSelected ls =
        let foundLevel = find (\lv -> (lv ^. _ReportLevel)."selected") ls
         in case foundLevel of
                 Just l -> l
                 Nothing -> skeletonReportLevel
  in ReportJudgement{ selected : getSelected levels
                    , levels : levels
                    }

hasDirects :: State -> Boolean
hasDirects st = length (directRows st) > 0

hasIndirects :: State -> Boolean
hasIndirects st = length (indirectRows st) > 0


hasImprecision :: State -> Boolean
hasImprecision st = (st ^. _State <<< project <<< _Project 
                    <<< imprecision <<< _Imprecision)
                   ."status" == "ready"

hasIndirectness :: State -> Boolean
hasIndirectness st = (st ^. _State <<< project <<< _Project 
                      <<< indirectness <<< _Indirectness)
                     ."status" == "ready"

hasIncoherence :: State -> Boolean
hasIncoherence st = (st ^. _State <<< project <<< _Project 
                    <<< incoherence <<< _Incoherence)
                   ."status" == "ready"

hasHeterogeneity :: State -> Boolean
hasHeterogeneity st = (st ^. _State <<< project <<< _Project 
                    <<< heterogeneity <<< _Heterogeneity
                    <<< heters <<< _Heters)
                   ."status" == "ready"

hasStudyLimitations :: State -> Boolean
hasStudyLimitations st = (st ^. _State <<< project <<< _Project 
                 <<< netRob <<< _NetRobModel 
                 <<< studyLimitations <<< _StudyLimitations)
                 ."status" == "ready"

hasPubbias :: State -> Boolean
hasPubbias st = (st ^. _State <<< project <<< _Project 
                 <<< pubbias <<< _Pubbias)
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


getIndirectness :: State -> Comparison -> IndirectnessBox
getIndirectness st c = do
  let boxs = st  ^. _State <<< project <<< _Project 
              <<< indirectness <<< _Indirectness
              <<< boxes
  if hasIndirectness st then
    let mbox = find (\ib -> 
              isIdOfComparison (ib ^. _IndirectnessBox)."id" c
              ) boxs 
        levelsText = (st ^. _State <<< text <<< _TextContent
                     <<< indirectnessText <<< _IndirectnessText)."levels"
        getcolor = do
           case mbox of 
               Nothing -> "grey"
               Just box -> let mlevel = (box ^. _IndirectnessBox)."levels" !! 
                                        ((box ^. _IndirectnessBox)."judgement"
                                        - 1)
                             in case mlevel of 
                                   Nothing -> "grey"
                                   Just level -> (level ^.
                                   _IndirectnessLevel)."color"
        getLabel = do 
          case mbox of 
               Nothing -> "error"
               Just box -> let mlabel = levelsText !!
                                        ((box ^. _IndirectnessBox)."judgement"
                                        - 1)
                             in case mlabel of 
                                   Nothing -> "error"
                                   Just label -> label
        getCustomized = do
          case mbox of
               Nothing -> false
               Just box -> 
                 (box ^. _IndirectnessBox)."judgement" /= 
                   (box ^. _IndirectnessBox)."ruleLevel"
     in case mbox of
                 Nothing -> skeletonIndirectnessBox
                 Just r -> (_IndirectnessBox <<< imprecisionboxcustomized .~
                 getCustomized) (
                           (_IndirectnessBox <<< imprecisionboxcolor .~ getcolor)(
                  _IndirectnessBox <<< imprecisionboxlabel .~ getLabel $ r)
                  )
    else
    skeletonIndirectnessBox



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

getImprecision :: State -> Comparison -> ImprecisionBox
getImprecision st c = do
  let boxs = st  ^. _State <<< project <<< _Project 
                     <<< imprecision <<< _Imprecision
                     <<< boxes
  if hasImprecision st then
    let mbox = find (\ib -> 
                isIdOfComparison (ib ^. _ImprecisionBox)."id" c
              ) boxs 
        levelsText = (st ^. _State <<< text <<< _TextContent
                     <<< imprecisionText <<< _ImprecisionText)."levels"
        getcolor = do
           case mbox of 
               Nothing -> "grey"
               Just box -> let mlevel = (box ^. _ImprecisionBox)."levels" !! 
                                        ((box ^. _ImprecisionBox)."judgement"
                                        - 1)
                             in case mlevel of 
                                   Nothing -> "grey"
                                   Just level -> (level ^.
                                   _ImprecisionLevel)."color"
        getLabel = do 
          case mbox of 
               Nothing -> "error"
               Just box -> let mlabel = levelsText !!
                                        ((box ^. _ImprecisionBox)."judgement"
                                        - 1)
                             in case mlabel of 
                                   Nothing -> "error"
                                   Just label -> label
        getCustomized = do
          case mbox of
               Nothing -> false
               Just box -> 
                 (box ^. _ImprecisionBox)."judgement" /= 
                   (box ^. _ImprecisionBox)."ruleLevel"
     in case mbox of
                 Nothing -> skeletonImprecisionBox
                 Just r -> (_ImprecisionBox <<< imprecisionboxcustomized .~
                 getCustomized) (
                         (_ImprecisionBox <<< imprecisionboxcolor .~ getcolor)(
                  _ImprecisionBox <<< imprecisionboxlabel .~ getLabel $ r)
                  )
    else
    skeletonImprecisionBox

getJudgementDebug :: State -> String
getJudgementDebug a =
  let comps = getDirects a
      rowjudgement st c = do
        let directs :: Array ReportRow
            directs = (st  ^. _State <<< project <<< _Project 
                         <<< report <<< _Report
                      )."directRows"
            indirects :: Array ReportRow
            indirects = (st  ^. _State <<< project <<< _Project 
                           <<< report <<< _Report
                        )."indirectRows"
        if hasJudgements st then
          let aresame r = isIdOfComparisonComma (r ^. _ReportRow)."id" c
              allrows = directs <> indirects
              judg = find (\ib -> 
                       aresame ib
                     ) allrows
           in show $ judg
          else "has no judgements, report not ready"
      selects = getSelected a
      rows = map (\s -> rowjudgement a s) 
             $ filter (isSelectedComparison selects) comps
   in show $ rows
    

getJudgement :: State -> Comparison -> ReportJudgement
getJudgement st c = do
  let directs :: Array ReportRow
      directs = (st  ^. _State <<< project <<< _Project 
                   <<< report <<< _Report
                )."directRows"
      indirects :: Array ReportRow
      indirects = (st  ^. _State <<< project <<< _Project 
                     <<< report <<< _Report
                  )."indirectRows"
  if hasJudgements st then
    let judg = find (\ib -> 
                  isIdOfComparisonComma (ib ^. _ReportRow)."id" c
              ) (directs <> indirects)
     in case judg of
                 Just j -> (j ^. _ReportRow)."judgement"
                 Nothing -> defaultJudgement st
    else
    defaultJudgement st

getIncoherence :: State -> Comparison -> IncoherenceBox
getIncoherence st c = do
  let incoherences = st  ^. _State <<< project <<< _Project 
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
    else
    skeletonHeterogeneityBox

getPubbias :: State -> Comparison -> PubbiasBox
getPubbias st c = do
  let boxs = st  ^. _State <<< project <<< _Project 
                     <<< pubbias <<< _Pubbias
                     <<< boxes
  if hasPubbias st then
    let mbox = find (\ib -> 
              isIdOfComparison (ib ^. _PubbiasBox)."id" c
              ) boxs 
        levelsText = (st ^. _State <<< text <<< _TextContent
                     <<< pubbiasText <<< _PubbiasText)."levels"
        getcolor = do
           case mbox of 
               Nothing -> "grey"
               Just box -> let mlevel = (box ^. _PubbiasBox)."levels" !! 
                                        ((box ^. _PubbiasBox)."judgement"
                                        - 1)
                             in case mlevel of 
                                   Nothing -> "grey"
                                   Just level -> (level ^.
                                   _PubbiasLevel)."color"
        getLabel = do 
          case mbox of 
               Nothing -> "error"
               Just box -> let mlabel = levelsText !!
                                        ((box ^. _PubbiasBox)."judgement"
                                        - 1)
                             in case mlabel of 
                                   Nothing -> "error"
                                   Just label -> label
        getCustomized = do
          case mbox of
               Nothing -> false
               Just box -> false
     in case mbox of
                 Nothing -> skeletonPubbiasBox
                 Just r -> (_PubbiasBox <<< pubbiasboxcustomized .~
                 getCustomized) (
                           (_PubbiasBox <<< pubbiasboxcolor .~ getcolor)(
                  _PubbiasBox <<< pubbiasboxlabel .~ getLabel $ r)
                  )
    else
    skeletonPubbiasBox

getRows :: State -> Array Comparison -> Array ReportRow
getRows a comps = 
  let selects = getSelected a
      rows =  map (\s -> 
             let c = s ^. _Comparison 
             in ReportRow { id : c."id"
             , armA : show (min c."t1" c."t2")
             , armB : show (max c."t1" c."t2")
             , numberOfStudies: c."numStudies"
             , studyLimitation: getStudyLimitation a s
             , heterogeneity: getHeterogeneity a s
             , incoherence: getIncoherence a s
             , imprecision: getImprecision a s
             , indirectness: getIndirectness a s
             , pubbias: getPubbias a s
             , judgement: getJudgement a s
             }) 
             $ filter (isSelectedComparison selects) comps
      in rows

directRows :: State -> Array ReportRow 
directRows a = getRows a $ getDirects a

indirectRows :: State -> Array ReportRow 
indirectRows a = getRows a $ getIndirects a  
