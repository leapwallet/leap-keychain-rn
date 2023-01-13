
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNLeapKeychainRnSpec.h"

@interface LeapKeychainRn : NSObject <NativeLeapKeychainRnSpec>
#else
#import <React/RCTBridgeModule.h>

@interface LeapKeychainRn : NSObject <RCTBridgeModule>
#endif

@end
