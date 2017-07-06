module Messenger where

import Prelude
import Control.Monad.Eff 
import Control.Promise as Promise
import Control.Promise (Promise)
import Control.Monad.Eff.Exception (message, error)
import Data.Foreign 
import Data.Function.Uncurried (Fn3, runFn3)

import Model

foreign import data CONFIRM :: Effect

foreign import confirmImpl :: 
    forall eff ttl msg sc. 
    Fn3 ttl msg sc 
    (Eff ( confirmEff :: CONFIRM | eff) Boolean)

confirm :: 
    forall eff ttl msg sc. 
    ttl -> msg -> sc -> 
    (Eff ( confirmEff :: CONFIRM | eff) Boolean)
confirm ttl msg sc = runFn3 confirmImpl ttl msg sc

