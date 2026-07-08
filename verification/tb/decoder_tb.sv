`timescale 1ns / 1ps

module decoder_tb;

logic [31:0] instruction;

logic [6:0] opcode;
logic [4:0] rd;
logic [2:0] funct3;
logic [4:0] rs1;
logic [4:0] rs2;
logic [6:0] funct7;

decoder dut(

    .instruction(instruction),
    .opcode(opcode),
    .rd(rd),
    .funct3(funct3),
    .rs1(rs1),
    .rs2(rs2),
    .funct7(funct7)

);

initial begin

    $display("==============================");
    $display(" Decoder Test");
    $display("==============================");

    // ADD x3,x1,x2
    instruction = 32'h002081B3;

    #10;

    if(opcode == 7'b0110011)
        $display("[PASS] Opcode");
    else
        $display("[FAIL] Opcode");

    if(rd == 5'd3)
        $display("[PASS] rd");
    else
        $display("[FAIL] rd");

    if(rs1 == 5'd1)
        $display("[PASS] rs1");
    else
        $display("[FAIL] rs1");

    if(rs2 == 5'd2)
        $display("[PASS] rs2");
    else
        $display("[FAIL] rs2");

    if(funct3 == 3'b000)
        $display("[PASS] funct3");
    else
        $display("[FAIL] funct3");

    if(funct7 == 7'b0000000)
        $display("[PASS] funct7");
    else
        $display("[FAIL] funct7");

    $display("==============================");
    $display(" Decoder Test Complete");
    $display("==============================");

    $finish;

end

endmodule