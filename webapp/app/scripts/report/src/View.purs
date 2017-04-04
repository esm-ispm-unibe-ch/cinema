module View where

import Prelude
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, log)

register :: forall e. String -> Unit
register s = unit


