`timescale 1ns / 1ps

module control_unit_tb;

logic [6:0] opcode;

logic RegWrite;
logic MemRead;
logic MemWrite;
logic MemtoReg;
logic ALUSrc;
logic Branch;
logic Jump;
logic [1:0] ALUOp;

control_unit dut(

    .opcode(opcode),

    .RegWrite(RegWrite),
    .MemRead(MemRead),
    .MemWrite(MemWrite),
    .MemtoReg(MemtoReg),
    .ALUSrc(ALUSrc),
    .Branch(Branch),
    .Jump(Jump),
    .ALUOp(ALUOp)

);

initial begin

    $display("===============================");
    $display(" Control Unit Test");
    $display("===============================");

    // R-Type
    opcode = 7'b0110011;
    #10;
    if(RegWrite && !ALUSrc)
        $display("[PASS] R-Type");
    else
        $display("[FAIL] R-Type");

    // Load
    opcode = 7'b0000011;
    #10;
    if(RegWrite && MemRead && MemtoReg)
        $display("[PASS] Load");
    else
        $display("[FAIL] Load");

    // Store
    opcode = 7'b0100011;
    #10;
    if(MemWrite)
        $display("[PASS] Store");
    else
        $display("[FAIL] Store");

    // Branch
    opcode = 7'b1100011;
    #10;
    if(Branch)
        $display("[PASS] Branch");
    else
        $display("[FAIL] Branch");

    // Jump
    opcode = 7'b1101111;
    #10;
    if(Jump)
        $display("[PASS] Jump");
    else
        $display("[FAIL] Jump");

    $display("===============================");
    $display(" All Tests Passed");
    $display("===============================");

    $finish;

end

endmodule