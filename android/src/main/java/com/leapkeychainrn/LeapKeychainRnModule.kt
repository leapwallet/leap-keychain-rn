package com.leapkeychainrn

import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import org.bitcoinj.crypto.DeterministicHierarchy
import org.bitcoinj.crypto.DeterministicKey
import org.bitcoinj.crypto.HDKeyDerivation
import org.bitcoinj.crypto.MnemonicCode

class LeapKeychainRnModule internal constructor(context: ReactApplicationContext) :
  LeapKeychainRnSpec(context) {

  override fun getName(): String {
    return NAME
  }

  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  @ReactMethod
  override fun multiply(a: Double, b: Double, promise: Promise) {
    promise.resolve(a * b)
  }

  @ReactMethod
  override fun mnemonicToSeed(words: ReadableArray, passphrase: String?, promise: Promise){
    try {
      val _words: MutableList<String> = arrayListOf()
      for (word: String in words.toArrayList() as ArrayList<String>){
        _words.add(word)
      }
      val seed = MnemonicCode.toSeed(_words, passphrase ?: "");

      val base64String = Base64.encodeToString(seed, Base64.NO_WRAP )
      promise.resolve(base64String)
    }catch (e: java.lang.Exception){
      promise.reject(e)
    }
  }

  companion object {
    const val NAME = "LeapKeychainRn"
  }
}
