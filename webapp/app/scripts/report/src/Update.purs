module Update where

import Prelude
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, log)

render :: forall e. String -> String
render e = "REPORT BABY!!"
