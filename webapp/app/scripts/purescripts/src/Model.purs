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
import StudyLimitationsModel
import InconsistencyModel
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

hasConMat :: State -> Boolean
hasConMat st = (st ^. _State <<< project <<< _Project 
                    <<< cmContainer <<< _CMContainer 
                    <<< currentCM <<< _ContributionMatrix)
                   ."status" == "ready"
-- Project >

-- Node <
newtype Node = Node
    { id :: TreatmentId
    , label :: String
    , numStudies :: Int
    , sampleSize :: Int
    , interventionType :: Maybe String
    }

derive instance genericNode :: Rep.Generic Node _

instance showNode :: Show Node where
    show = genericShow

instance equalNodes :: Eq Node where
  eq nA nB = ((nA ^. _Node)."id") == ((nB ^. _Node)."id")

instance orderNodes :: Ord Node where
  compare nA nB = compare ((nA ^. _Node)."id")  ((nB ^. _Node)."id")

instance decodeNode :: Decode Node where
  decode n = do
    id <- n ! "id" >>= readTreatmentId
    let label = n ! "label" >>= readString
    numStudies <- n ! "numStudies" >>= readNumber
    sampleSize <- n ! "sampleSize" >>= readNumber
    let l = case (runExcept label) of
         Left _ -> do 
           let lll = n ! "label" >>= readInt
           let outl = case (runExcept lll) of
                Left _ -> ""
                Right llll -> show llll
           outl
         Right ll -> ll
    let it = n ! "interventionType" >>= readString
    let interventionType = case (runExcept it) of
          Left _ -> Nothing
          Right intp -> Just intp
    pure $ Node { id
                , label : l
                , numStudies : floor numStudies
                , sampleSize : floor sampleSize
                , interventionType
                }

interventionType :: forall a b r. Lens { interventionType :: a | r } { interventionType :: b | r } a b
interventionType = prop (SProxy :: SProxy "interventionType")

_Node :: Lens' Node (Record _)
_Node = lens (\(Node s) -> s) (\_ -> Node)
-- Node >

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
-- Comparison <
data TreatmentId = StringId String | IntId Int
instance showTreatmentId :: Show TreatmentId where
  show (StringId a) = show a
  show (IntId a) = show a

instance equalTreatmentId :: Eq TreatmentId where
  eq (StringId a) (StringId b)  = ((show a) == (show b))
  eq (IntId a) (IntId b) = ((show a) == (show b))
  eq (StringId a) (IntId b) = false
  eq (IntId a) (StringId b) = false

instance orderTreatmentId :: Ord TreatmentId where
  compare (StringId a) (StringId b) = compare a b
  compare (IntId a) (IntId b) = compare a b
  compare (StringId a) (IntId b) = GT
  compare (IntId a) (StringId b) = LT

instance decodeTreatmentId :: Decode TreatmentId where
  decode = readTreatmentId

readTreatmentId :: Foreign -> F TreatmentId
readTreatmentId tid = do
  let sid = runExcept $ readString tid
  case sid of 
       Left _ -> do 
         let iid = runExcept $ readInt tid
         case iid of
             Left _ -> pure $ StringId "Error"
             Right oid -> IntId <$> (readInt tid)
       Right id -> do
         case fromString id of 
              Just iid -> pure $ IntId iid
              Nothing -> pure $ StringId id

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
     Nothing -> StringId str
  
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


comparisonsOrdering :: Comparison -> Comparison -> Ordering
comparisonsOrdering compA compB 
  | ((compA ^. _Comparison)."t1") > ((compB ^. _Comparison)."t1" ) = GT
  | ((compA ^. _Comparison)."t1" ) < ((compB ^. _Comparison)."t1") = LT
  | ((compA ^. _Comparison)."t1") == ((compB ^. _Comparison)."t1") = 
    compare ((compA ^. _Comparison)."t2") ((compB ^. _Comparison)."t2")
  | otherwise = EQ

isIdOfComparison :: String -> Comparison -> Boolean
isIdOfComparison id comp = do
  let t1 = min (comp ^. _Comparison)."t1" (comp ^. _Comparison)."t2"
      t2 = max (comp ^. _Comparison)."t1" (comp ^. _Comparison)."t2"
      sid = S.split (S.Pattern ":") id
      st1 = unsafePartial $ fromJust $ head sid
      st2 = unsafePartial $ fromJust $ last sid
  (st1 == treatmentIdToString t1) && (st2 == treatmentIdToString t2)  ||
  (st1 == treatmentIdToString t2) && (st2 == treatmentIdToString t1) 

hasNode :: Comparison -> Node -> Boolean
hasNode c n = do
  let t1 = (c ^. _Comparison)."t1"
      t2 = (c ^. _Comparison)."t2"
      nid = (n ^. _Node)."id"
  t1 == nid || t2 == nid
  

isSelectedComparison :: forall eff. Array String -> Comparison -> Boolean
isSelectedComparison selected comp = do
  let isSelected = foldl (||) false $ map (\sid -> do
                   isIdOfComparison sid comp
                  ) selected
  isSelected

isSelectedNode :: forall eff. Array String -> Node -> Boolean
isSelectedNode selected node = do
  let isSelected = foldl (||) false $ map (\sid -> do
                   hasNode (stringToComparison ":" sid) node
                  ) selected
  isSelected

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

