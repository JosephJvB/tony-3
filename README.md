# Tony 3

project plan

1. setup
2. try trivial testing: does jest take a long time to execute with CDK?
  - yeah seems OK so far not slow, idk what I did wrong on the other project
  - NOW it's slow, I've installed a bunch of node modules!! JEST!!!!
  - holy shit vitest is immediate, get jest in the bin!
  - ah. So vitest is not doing typechecking. Jest is slow because it's typechecking.
  - Actually, it's running the TS-build, which takes about 4sec. From tsconfig.json:
    - `"skipLibCheck": true, // speeds up build 50%, 8sec -> 4sec. Does not improve test speed`
    - cool, FAST alternatives to ts-jest
      - @swc/core @swc/jest
      - esbuild esbuild-jest
      - but jest.spyOn() breaks with both of these!!!!!
      - do these do typechecking tho? NO THEY DONT
    - lets try babel?
      - lmao babel also doesn't do typechecking
  - what I learned. The expensive bit is the typechecking. Any option will be fast without typechecking.