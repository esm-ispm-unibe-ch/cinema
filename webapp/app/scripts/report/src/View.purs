module Main.View where

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
import TemplateReport as T
import Data.Lens 
import Data.Lens.Index
import Data.Lens.Record
import Data.Lens.Traversal
import Text.Smolder.Renderer.String (render) as S 
import Partial.Unsafe (unsafePartial)

import Model
import TextModel
import Actions

opts = defaultOptions { unwrapSingleConstructors = true }

-- StudyLimitation <
newtype StudyLimitation = StudyLimitation
    { id :: String
    , customized :: Boolean
    , label :: String
    , value :: Int
    , rules :: Array RobRule
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
                                          , label : "Not set"
                                          , value : 0
                                          , rules : []
                                          }
-- StudyLimitation >

register :: forall e. Foreign -> Unit
register s = unit

isReady :: State -> Boolean
isReady s 
  | (s ^. _State <<< project <<< _Project 
    <<< netRob <<< _NetRobModel 
    <<< studyLimitations <<< _StudyLimitations)
    ."status" == "ready" = true
  | (s ^. _State <<< project <<< _Project 
    <<< inconsistency <<< _Inconsistency)
    ."status" == "ready" = true
  | otherwise = false

type ViewModel r = 
  { isReady :: Boolean
  , directRows :: Array ReportRow
  , indirectRows :: Array ReportRow
  , hasDirects :: Boolean
  , hasIndirects :: Boolean
  , hasStudyLimitations :: Boolean
  , studyLimitationsRule :: RobRule
  | r
  }

type ReportRow = 
  { id :: String
  , armA:: String
  , armB :: String
  , numberOfStudies :: Int
  , studyLimitation :: StudyLimitation
  {--, imprecision :: Maybe Imprecision--}
  {--, heterogeneity :: Maybe Heterogeneity--}
  {--, incoherence :: Maybe Incoherence--}
  {--, indirectness :: Maybe Indirectness--}
  {--, pubBias :: Maybe PubBias--}
  }

comparisonsOrdering :: Comparison -> Comparison -> Ordering
comparisonsOrdering compA compB 
  | ((compA ^. _Comparison)."t1") > ((compB ^. _Comparison)."t1" ) = GT
  | ((compA ^. _Comparison)."t1" ) < ((compB ^. _Comparison)."t1") = LT
  | ((compA ^. _Comparison)."t1") == ((compB ^. _Comparison)."t1") = 
    compare ((compA ^. _Comparison)."t2") ((compB ^. _Comparison)."t2")
  | otherwise = EQ

isSelectedComparison :: forall eff. Array String -> Comparison -> Boolean
isSelectedComparison selected comp = do
  let isSelected = foldl (||) false $ map (\sid -> do
                   isIdOfComparison sid comp
                  ) selected
  isSelected

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

getSelected :: State -> Array String
getSelected st = (st  ^. _State <<< project <<< _Project 
                 <<< cmContainer <<< _CMContainer
                 <<< currentCM <<< _ContributionMatrix)."selectedComparisons"

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

isIdOfComparison :: String -> Comparison -> Boolean
isIdOfComparison id comp = do
  let t1 = min (comp ^. _Comparison)."t1" (comp ^. _Comparison)."t2"
      t2 = max (comp ^. _Comparison)."t1" (comp ^. _Comparison)."t2"
      sid = S.split (S.Pattern ":") id
      st1 = unsafePartial $ fromJust $ head sid
      st2 = unsafePartial $ fromJust $ last sid
  (st1 == treatmentIdToString t1) && (st2 == treatmentIdToString t2)  ||
  (st1 == treatmentIdToString t2) && (st2 == treatmentIdToString t1) 

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
                           }
                Nothing -> skeletonStudyLimitation
    else
    skeletonStudyLimitation

directRows :: State -> Array ReportRow 
directRows a = 
  let selects = getSelected a
      directs = getDirects a  
      rows =  map (\s -> 
             let c = s ^. _Comparison 
             in { id : c."id"
             , armA : show (min c."t1" c."t2")
             , armB : show (max c."t1" c."t2")
             , numberOfStudies: c."numStudies"
             , studyLimitation: getStudyLimitation a s
             }) 
             $ filter (isSelectedComparison selects) directs
      in rows


indirectRows :: State -> Array ReportRow 
indirectRows a = 
  let selects = getSelected a
      indirects = getIndirects a  
      rows =  map (\s -> 
             let c = s ^. _Comparison 
             in { id : c."id"
             , armA : show (min c."t1" c."t2")
             , armB : show (max c."t1" c."t2")
             , numberOfStudies: c."numStudies"
             , studyLimitation: getStudyLimitation a s
             }) 
             $ filter (isSelectedComparison selects) indirects
      in rows


hasDirects :: State -> Boolean
hasDirects st = length (directRows st) > 0

hasIndirects :: State -> Boolean
hasIndirects st = length (indirectRows st) > 0

hasStudyLimitations :: State -> Boolean
hasStudyLimitations st = (st ^. _State <<< project <<< _Project 
                 <<< netRob <<< _NetRobModel 
                 <<< studyLimitations <<< _StudyLimitations)
                 ."status" == "ready"

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
            , studyLimitationsRule : getStudyLimitationsRule a
          }
        viewData = b
    in compile T.template viewData

errorTemplate :: forall a. a -> String
errorTemplate = compile "<div class='error-cont error col-md-offset-1 \
  \ col-md-10'> {{{.}}} </div>"
