module Main where

import Prelude
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, log)

main :: forall e. String -> Eff (console :: CONSOLE | e) Unit
main e = do
  log e

logModel :: forall e. String -> String
logModel model = model <> "baby!!"

render :: forall e. String -> String
render e = "REPORT BABY!!"
