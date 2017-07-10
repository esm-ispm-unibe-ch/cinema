module ComparisonModel where

import Prelude
import Control.Monad.Eff 
import Control.Monad.Eff.Console (CONSOLE, log, logShow)
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

opts = defaultOptions { unwrapSingleConstructors = true }

-- Comparison <
data TreatmentId = StringId String | IntId Int
instance showTreatmentId :: Show TreatmentId where
  show (StringId a) = a
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
             Left _ ->  pure $ StringId "Error"
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

instance equalComparisons :: Eq Comparison where
  eq compA compB = 
     (min ((compA ^. _Comparison)."t1") 
          ((compA ^. _Comparison)."t2" ) ==
      min ((compB ^. _Comparison)."t1") 
          ((compB ^. _Comparison)."t2" ))&&
     (max ((compA ^. _Comparison)."t1") 
          ((compA ^. _Comparison)."t2" ) ==
      max ((compB ^. _Comparison)."t1") 
          ((compB ^. _Comparison)."t2" ))

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

sortStringComparisonIds :: Foreign -> Foreign
sortStringComparisonIds fsids = do
  let eids = decode fsids
  let ids = case runExcept eids of
           Left _ -> []
           Right (idss :: (Array String)) -> idss
  toForeign $ sortBy (\id1 id2 -> 
    comparisonsOrdering (stringToComparison ":" id1)
      (stringToComparison ":" id2)) ids

{--fixComparisonId :: forall eff. Foreign -> Eff (console :: CONSOLE | eff) Unit --}
fixComparisonId :: Foreign -> Foreign
fixComparisonId fsid = do
  let esid = readString fsid
      sid = case runExcept esid of
        Left _ -> "error"
        Right id -> show ((stringToComparison ":" id) ^. _Comparison)."t1" <>
                                                  ":" <>
            show ((stringToComparison ":" id) ^. _Comparison)."t2"
  {--logShow $ "TO SID POUT VGANEI EINAI" <>  sid--}
  toForeign sid
-- Comparison >

-- InterventionType <
newtype InterventionType = InterventionType
    { id :: String
    , label :: String
    , isSelected :: Boolean
    , isActive :: Boolean
    , isDisabled :: Boolean
    }

derive instance genericInterventionType :: Rep.Generic InterventionType _

instance showInterventionType :: Show InterventionType where
    show = genericShow

instance decodeInterventionType :: Decode InterventionType where
  decode = genericDecode opts

_InterventionType :: Lens' InterventionType (Record _)
_InterventionType = lens (\(InterventionType s) -> s) (\_ -> InterventionType)

defaultInterventionTypes :: Array InterventionType
defaultInterventionTypes = [ InterventionType { id: "notset"
                                              , label: "--"
                                              , isDisabled: true
                                              , isActive: true
                                              , isSelected: false
                                              },
                             InterventionType { id: "Pharmacological"
                                              , label: "Pharmacological"
                                              , isDisabled: false
                                              , isActive: false
                                              , isSelected: false
                                              },
                             InterventionType { id: "Placebo/Control"
                                              , label: "Placebo/Control"
                                              , isDisabled: false
                                              , isActive: false
                                              , isSelected: false
                                              },
                             InterventionType { id: "Non-pharmacological"
                                              , label: "Non-pharmacological"
                                              , isDisabled: false
                                              , isActive: false
                                              , isSelected: false
                                              }
                           ]
-- InterventionType >


-- Node <
newtype Node = Node
    { id :: TreatmentId
    , label :: String
    , numStudies :: Int
    , sampleSize :: Int
    , interventionType :: Array InterventionType
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
    numStudies <- n ! "numStudies" >>= readNumber
    sampleSize <- n ! "sampleSize" >>= readNumber
    let label = n ! "label" >>= readString
    let l = case (runExcept label) of
         Left _ -> do 
           let lll = n ! "label" >>= readInt
           let outl = case (runExcept lll) of
                Left _ -> ""
                Right llll -> show llll
           outl
         Right ll -> ll
    let it = n ! "interventionType" >>= decode
    let interventionType = case (runExcept it) of
          Left r -> defaultInterventionTypes
          Right intp -> intp
    pure $ Node { id
                , label : l
                , numStudies : floor numStudies
                , sampleSize : floor sampleSize
                , interventionType
                }
nodeId :: forall a b r. Lens { "id" :: a | r } { "id" :: b | r } a b
nodeId = prop (SProxy :: SProxy "id")


interventionType :: forall a b r. Lens { interventionType :: a | r } { interventionType :: b | r } a b
interventionType = prop (SProxy :: SProxy "interventionType")

_Node :: Lens' Node (Record _)
_Node = lens (\(Node s) -> s) (\_ -> Node)
-- Node >

