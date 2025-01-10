package com.leapkeychainrn

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray

abstract class LeapKeychainRnSpec internal constructor(context: ReactApplicationContext) :
  NativeLeapKeychainRnSpec(context) {

  abstract fun multiply(a: Double, b: Double, promise: Promise)
  abstract override fun mnemonicToSeed(mnemonic: ReadableArray, passphrase: String?, promise: Promise)
}
